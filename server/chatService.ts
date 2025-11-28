/**
 * Chat Service
 * 
 * Handles vendor-customer messaging with:
 * - Profanity filtering
 * - Contact info blocking (phone, email, social media)
 * - Conversation management linked to bookings/orders
 * - Message moderation
 */

import { db } from './db';
import { 
  chatConversations, 
  chatMessages,
  users,
  InsertChatConversation,
  InsertChatMessage
} from '../shared/schema';
import { eq, and, or, desc, sql, isNull, asc } from 'drizzle-orm';

// ===========================================
// PROFANITY FILTER
// ===========================================

/**
 * List of profane words to filter (basic list - extend as needed)
 * In production, consider using a dedicated library like 'bad-words'
 */
const PROFANITY_LIST = [
  // Common profanity - extend this list as needed
  'fuck', 'shit', 'damn', 'ass', 'bitch', 'bastard', 'crap', 'dick', 'cock',
  'pussy', 'whore', 'slut', 'nigger', 'faggot', 'retard', 'cunt',
  // Swiss German profanity
  'scheisse', 'arschloch', 'wichser', 'hurensohn', 'fotze',
  // French profanity
  'merde', 'putain', 'salope', 'connard', 'enculé',
  // Italian profanity
  'cazzo', 'merda', 'stronzo', 'puttana', 'vaffanculo'
];

// Pre-compile regex for efficiency
const profanityRegex = new RegExp(
  `\\b(${PROFANITY_LIST.join('|')})\\b`,
  'gi'
);

/**
 * Check if text contains profanity
 */
export function containsProfanity(text: string): { hasProfanity: boolean; matches: string[] } {
  const matches = text.match(profanityRegex) || [];
  return {
    hasProfanity: matches.length > 0,
    matches: [...new Set(matches.map(m => m.toLowerCase()))]
  };
}

/**
 * Filter profanity from text (replace with asterisks)
 */
export function filterProfanity(text: string): { filtered: string; wasFiltered: boolean } {
  const hasMatch = profanityRegex.test(text);
  if (!hasMatch) {
    return { filtered: text, wasFiltered: false };
  }
  
  const filtered = text.replace(profanityRegex, (match) => '*'.repeat(match.length));
  return { filtered, wasFiltered: true };
}

// ===========================================
// CONTACT INFO BLOCKING
// ===========================================

/**
 * Patterns for detecting contact information
 */
const CONTACT_PATTERNS = {
  // Phone numbers (international format, Swiss format, etc.)
  phone: [
    /(?:\+|00)[0-9]{1,3}[\s.-]?[0-9]{2,4}[\s.-]?[0-9]{3,4}[\s.-]?[0-9]{2,4}/gi,  // International
    /0[0-9]{2}[\s.-]?[0-9]{3}[\s.-]?[0-9]{2}[\s.-]?[0-9]{2}/gi,                   // Swiss landline
    /07[0-9][\s.-]?[0-9]{3}[\s.-]?[0-9]{2}[\s.-]?[0-9]{2}/gi,                     // Swiss mobile
    /\b[0-9]{3}[\s.-]?[0-9]{3}[\s.-]?[0-9]{4}\b/gi,                                // US format
    /\b[0-9]{10,14}\b/gi,                                                          // Consecutive digits
  ],
  
  // Email addresses
  email: [
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
    /[a-zA-Z0-9._%+-]+\s*[\[\(]?at[\]\)]?\s*[a-zA-Z0-9.-]+\s*[\[\(]?dot[\]\)]?\s*[a-zA-Z]{2,}/gi, // "at" and "dot" variants
    /[a-zA-Z0-9._%+-]+\s*@\s*[a-zA-Z0-9.-]+\s*\.\s*[a-zA-Z]{2,}/gi, // Spaced variants
  ],
  
  // Social media handles and URLs
  social: [
    /(?:instagram|ig|insta)\s*[:\-@]?\s*[a-zA-Z0-9._]+/gi,
    /(?:facebook|fb)\s*[:\-@\/]?\s*[a-zA-Z0-9._]+/gi,
    /(?:twitter|x\.com)\s*[:\-@\/]?\s*[a-zA-Z0-9._]+/gi,
    /(?:telegram|tg)\s*[:\-@]?\s*[a-zA-Z0-9._]+/gi,
    /(?:whatsapp|wa)\s*[:\-]?\s*[\+]?[0-9\s]+/gi,
    /(?:snapchat|snap)\s*[:\-@]?\s*[a-zA-Z0-9._]+/gi,
    /(?:tiktok|tt)\s*[:\-@]?\s*[a-zA-Z0-9._]+/gi,
    /(?:linkedin)\s*[:\-@\/]?\s*[a-zA-Z0-9._-]+/gi,
  ],
  
  // URLs
  url: [
    /https?:\/\/[^\s<>"\[\]{}|\\^`]+/gi,
    /www\.[^\s<>"\[\]{}|\\^`]+/gi,
    /[a-zA-Z0-9.-]+\.(?:com|ch|de|fr|it|org|net|io|co)[^\s<>"\[\]{}|\\^`]*/gi,
  ],
};

/**
 * Check if text contains contact information
 */
export function containsContactInfo(text: string): {
  hasContactInfo: boolean;
  types: string[];
  matches: string[];
} {
  const foundTypes: string[] = [];
  const foundMatches: string[] = [];
  
  for (const [type, patterns] of Object.entries(CONTACT_PATTERNS)) {
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        foundTypes.push(type);
        foundMatches.push(...matches);
      }
    }
  }
  
  return {
    hasContactInfo: foundTypes.length > 0,
    types: [...new Set(foundTypes)],
    matches: [...new Set(foundMatches)]
  };
}

/**
 * Filter contact information from text
 */
export function filterContactInfo(text: string): {
  filtered: string;
  wasFiltered: boolean;
  blockedItems: string[];
} {
  let filtered = text;
  const blockedItems: string[] = [];
  
  for (const patterns of Object.values(CONTACT_PATTERNS)) {
    for (const pattern of patterns) {
      const matches = filtered.match(pattern);
      if (matches) {
        blockedItems.push(...matches);
        filtered = filtered.replace(pattern, '[contact info removed]');
      }
    }
  }
  
  return {
    filtered,
    wasFiltered: blockedItems.length > 0,
    blockedItems: [...new Set(blockedItems)]
  };
}

// ===========================================
// MESSAGE MODERATION
// ===========================================

interface ModerationResult {
  isClean: boolean;
  filteredContent: string;
  originalContent?: string;
  filterReasons: ('profanity' | 'contact_info')[];
  blockedContent?: string;
}

/**
 * Moderate a message for profanity and contact info
 */
export function moderateMessage(content: string): ModerationResult {
  const filterReasons: ('profanity' | 'contact_info')[] = [];
  const blockedItems: string[] = [];
  let filteredContent = content;
  
  // Check and filter profanity
  const profanityCheck = containsProfanity(content);
  if (profanityCheck.hasProfanity) {
    filterReasons.push('profanity');
    blockedItems.push(...profanityCheck.matches);
    const profanityFilter = filterProfanity(filteredContent);
    filteredContent = profanityFilter.filtered;
  }
  
  // Check and filter contact info
  const contactCheck = containsContactInfo(filteredContent);
  if (contactCheck.hasContactInfo) {
    filterReasons.push('contact_info');
    blockedItems.push(...contactCheck.matches);
    const contactFilter = filterContactInfo(filteredContent);
    filteredContent = contactFilter.filtered;
  }
  
  const wasFiltered = filterReasons.length > 0;
  
  return {
    isClean: !wasFiltered,
    filteredContent,
    originalContent: wasFiltered ? content : undefined,
    filterReasons,
    blockedContent: blockedItems.length > 0 ? blockedItems.join(', ') : undefined,
  };
}

// ===========================================
// CONVERSATION MANAGEMENT
// ===========================================

/**
 * Get or create a conversation between customer and vendor
 */
export async function getOrCreateConversation(params: {
  customerId: string;
  vendorId: string;
  bookingId?: string;
  orderId?: string;
  serviceId?: string;
}): Promise<typeof chatConversations.$inferSelect> {
  // Try to find existing conversation with same context
  const conditions = [
    eq(chatConversations.customerId, params.customerId),
    eq(chatConversations.vendorId, params.vendorId),
  ];
  
  if (params.bookingId) {
    conditions.push(eq(chatConversations.bookingId, params.bookingId));
  }
  if (params.orderId) {
    conditions.push(eq(chatConversations.orderId, params.orderId));
  }
  
  const [existing] = await db.select()
    .from(chatConversations)
    .where(and(...conditions))
    .limit(1);
  
  if (existing) {
    return existing;
  }
  
  // Create new conversation
  const [conversation] = await db.insert(chatConversations)
    .values({
      customerId: params.customerId,
      vendorId: params.vendorId,
      bookingId: params.bookingId,
      orderId: params.orderId,
      serviceId: params.serviceId,
      status: 'active',
    })
    .returning();
  
  return conversation;
}

/**
 * Get conversations for a user
 */
export async function getUserConversations(
  userId: string,
  role: 'customer' | 'vendor' | 'both' = 'both',
  limit: number = 20,
  offset: number = 0
) {
  let condition;
  
  if (role === 'customer') {
    condition = eq(chatConversations.customerId, userId);
  } else if (role === 'vendor') {
    condition = eq(chatConversations.vendorId, userId);
  } else {
    condition = or(
      eq(chatConversations.customerId, userId),
      eq(chatConversations.vendorId, userId)
    );
  }
  
  const conversations = await db.select()
    .from(chatConversations)
    .where(and(
      condition,
      sql`${chatConversations.status} != 'blocked'`
    ))
    .orderBy(desc(chatConversations.lastMessageAt))
    .limit(limit)
    .offset(offset);
  
  return conversations;
}

/**
 * Get a conversation by ID (with access check)
 */
export async function getConversationById(
  conversationId: string,
  userId: string
): Promise<typeof chatConversations.$inferSelect | null> {
  const [conversation] = await db.select()
    .from(chatConversations)
    .where(
      and(
        eq(chatConversations.id, conversationId),
        or(
          eq(chatConversations.customerId, userId),
          eq(chatConversations.vendorId, userId)
        )
      )
    )
    .limit(1);
  
  return conversation || null;
}

// ===========================================
// MESSAGE MANAGEMENT
// ===========================================

/**
 * Send a message in a conversation
 */
export async function sendMessage(params: {
  conversationId: string;
  senderId: string;
  content: string;
  messageType?: 'text' | 'image' | 'file' | 'system' | 'booking_update' | 'payment_update';
  attachments?: any[];
}): Promise<typeof chatMessages.$inferSelect> {
  // Verify sender has access to conversation
  const conversation = await getConversationById(params.conversationId, params.senderId);
  
  if (!conversation) {
    throw new Error('Conversation not found or access denied');
  }
  
  if (conversation.status === 'blocked' || conversation.status === 'closed') {
    throw new Error('Cannot send messages in this conversation');
  }
  
  // Determine sender role
  const senderRole = conversation.customerId === params.senderId ? 'customer' : 'vendor';
  
  // Moderate the message
  const moderation = moderateMessage(params.content);
  
  // Create message
  const [message] = await db.insert(chatMessages)
    .values({
      conversationId: params.conversationId,
      senderId: params.senderId,
      senderRole,
      content: moderation.filteredContent,
      originalContent: moderation.originalContent,
      messageType: params.messageType || 'text',
      attachments: params.attachments ? JSON.stringify(params.attachments) : undefined,
      wasFiltered: !moderation.isClean,
      filterReason: moderation.filterReasons[0], // Primary reason
      blockedContent: moderation.blockedContent,
    })
    .returning();
  
  // Update conversation
  const preview = moderation.filteredContent.substring(0, 100);
  const unreadField = senderRole === 'customer' 
    ? { vendorUnreadCount: sql`${chatConversations.vendorUnreadCount} + 1` }
    : { customerUnreadCount: sql`${chatConversations.customerUnreadCount} + 1` };
  
  await db.update(chatConversations)
    .set({
      lastMessageAt: new Date(),
      lastMessagePreview: preview,
      ...unreadField,
      updatedAt: new Date(),
      // Flag for review if message was filtered
      flaggedForReview: !moderation.isClean ? true : undefined,
      flagReason: !moderation.isClean ? `${moderation.filterReasons.join(', ')}: ${moderation.blockedContent}` : undefined,
    })
    .where(eq(chatConversations.id, params.conversationId));
  
  return message;
}

/**
 * Get messages in a conversation
 */
export async function getMessages(
  conversationId: string,
  userId: string,
  limit: number = 50,
  beforeMessageId?: string
) {
  // Verify access
  const conversation = await getConversationById(conversationId, userId);
  
  if (!conversation) {
    throw new Error('Conversation not found or access denied');
  }
  
  let conditions = [eq(chatMessages.conversationId, conversationId)];
  
  if (beforeMessageId) {
    const [beforeMessage] = await db.select()
      .from(chatMessages)
      .where(eq(chatMessages.id, beforeMessageId))
      .limit(1);
    
    if (beforeMessage) {
      conditions.push(sql`${chatMessages.createdAt} < ${beforeMessage.createdAt}`);
    }
  }
  
  const messages = await db.select()
    .from(chatMessages)
    .where(and(...conditions))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);
  
  // Return in chronological order
  return messages.reverse();
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
  conversationId: string,
  userId: string
) {
  const conversation = await getConversationById(conversationId, userId);
  
  if (!conversation) {
    throw new Error('Conversation not found');
  }
  
  const isCustomer = conversation.customerId === userId;
  
  // Mark all unread messages from the other party as read
  await db.update(chatMessages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(chatMessages.conversationId, conversationId),
        sql`${chatMessages.senderId} != ${userId}`,
        isNull(chatMessages.readAt)
      )
    );
  
  // Reset unread count
  const updateField = isCustomer
    ? { customerUnreadCount: 0 }
    : { vendorUnreadCount: 0 };
  
  await db.update(chatConversations)
    .set(updateField)
    .where(eq(chatConversations.id, conversationId));
}

/**
 * Get unread message count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const result = await db.select({
    total: sql<number>`
      SUM(
        CASE 
          WHEN ${chatConversations.customerId} = ${userId} THEN ${chatConversations.customerUnreadCount}
          WHEN ${chatConversations.vendorId} = ${userId} THEN ${chatConversations.vendorUnreadCount}
          ELSE 0
        END
      )
    `
  })
  .from(chatConversations)
  .where(
    or(
      eq(chatConversations.customerId, userId),
      eq(chatConversations.vendorId, userId)
    )
  );
  
  return result[0]?.total || 0;
}

// ===========================================
// SYSTEM MESSAGES
// ===========================================

/**
 * Send a system message (e.g., booking update, payment notification)
 */
export async function sendSystemMessage(
  conversationId: string,
  content: string,
  messageType: 'system' | 'booking_update' | 'payment_update' = 'system'
): Promise<typeof chatMessages.$inferSelect> {
  const [conversation] = await db.select()
    .from(chatConversations)
    .where(eq(chatConversations.id, conversationId))
    .limit(1);
  
  if (!conversation) {
    throw new Error('Conversation not found');
  }
  
  const [message] = await db.insert(chatMessages)
    .values({
      conversationId,
      senderId: conversation.vendorId, // System messages attributed to vendor side
      senderRole: 'system',
      content,
      messageType,
      wasFiltered: false,
    })
    .returning();
  
  // Update conversation
  await db.update(chatConversations)
    .set({
      lastMessageAt: new Date(),
      lastMessagePreview: content.substring(0, 100),
      customerUnreadCount: sql`${chatConversations.customerUnreadCount} + 1`,
      vendorUnreadCount: sql`${chatConversations.vendorUnreadCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(chatConversations.id, conversationId));
  
  return message;
}

// ===========================================
// MODERATION & ADMIN
// ===========================================

/**
 * Block a conversation (admin or either party)
 */
export async function blockConversation(
  conversationId: string,
  userId: string,
  reason?: string
) {
  const conversation = await getConversationById(conversationId, userId);
  
  if (!conversation) {
    throw new Error('Conversation not found or access denied');
  }
  
  await db.update(chatConversations)
    .set({
      status: 'blocked',
      flaggedForReview: true,
      flagReason: reason || 'Blocked by user',
      updatedAt: new Date(),
    })
    .where(eq(chatConversations.id, conversationId));
}

/**
 * Get flagged conversations (for admin review)
 */
export async function getFlaggedConversations(limit: number = 20, offset: number = 0) {
  return await db.select()
    .from(chatConversations)
    .where(eq(chatConversations.flaggedForReview, true))
    .orderBy(desc(chatConversations.updatedAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Clear flag on a conversation (admin)
 */
export async function clearConversationFlag(conversationId: string) {
  await db.update(chatConversations)
    .set({
      flaggedForReview: false,
      flagReason: null,
      updatedAt: new Date(),
    })
    .where(eq(chatConversations.id, conversationId));
}

/**
 * Delete a message (soft delete)
 */
export async function deleteMessage(
  messageId: string,
  userId: string
): Promise<boolean> {
  // Find the message and verify ownership
  const [message] = await db.select()
    .from(chatMessages)
    .where(eq(chatMessages.id, messageId))
    .limit(1);
  
  if (!message || message.senderId !== userId) {
    return false;
  }
  
  // Soft delete
  await db.update(chatMessages)
    .set({
      isDeleted: true,
      deletedAt: new Date(),
      content: '[Message deleted]',
    })
    .where(eq(chatMessages.id, messageId));
  
  return true;
}

/**
 * Edit a message
 */
export async function editMessage(
  messageId: string,
  userId: string,
  newContent: string
): Promise<typeof chatMessages.$inferSelect | null> {
  // Find the message and verify ownership
  const [message] = await db.select()
    .from(chatMessages)
    .where(eq(chatMessages.id, messageId))
    .limit(1);
  
  if (!message || message.senderId !== userId || message.isDeleted) {
    return null;
  }
  
  // Check if edit is within time limit (e.g., 15 minutes)
  const editTimeLimit = 15 * 60 * 1000; // 15 minutes
  if (Date.now() - message.createdAt.getTime() > editTimeLimit) {
    throw new Error('Message can no longer be edited');
  }
  
  // Moderate the new content
  const moderation = moderateMessage(newContent);
  
  const [updated] = await db.update(chatMessages)
    .set({
      content: moderation.filteredContent,
      originalContent: moderation.originalContent || message.originalContent,
      isEdited: true,
      editedAt: new Date(),
      wasFiltered: !moderation.isClean || message.wasFiltered,
      filterReason: moderation.filterReasons[0] || message.filterReason,
    })
    .where(eq(chatMessages.id, messageId))
    .returning();
  
  return updated;
}

