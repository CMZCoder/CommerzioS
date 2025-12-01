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
  userBlocks,
  favorites,
  InsertChatConversation,
  InsertChatMessage
} from '../shared/schema';
import { eq, and, or, desc, sql, isNull, asc, inArray } from 'drizzle-orm';

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
  // Try to find existing ACTIVE conversation with same context (exclude archived/deleted)
  // IMPORTANT: We check serviceId to ensure each service gets its own conversation
  const conditions = [
    eq(chatConversations.customerId, params.customerId),
    eq(chatConversations.vendorId, params.vendorId),
    sql`${chatConversations.status} != 'archived'`, // Exclude archived/deleted conversations
  ];
  
  // If serviceId is provided, ONLY match conversations with the EXACT same serviceId
  // This ensures each service gets its own conversation, even if there are existing
  // conversations with the same vendor but different/no serviceId
  if (params.serviceId) {
    // CRITICAL: Only match conversations with this exact serviceId
    // Do NOT match conversations with NULL serviceId or different serviceId
    conditions.push(eq(chatConversations.serviceId, params.serviceId));
  } else {
    // If no serviceId provided, only match conversations without a serviceId
    // This is for general inquiries not tied to a specific service
    conditions.push(sql`${chatConversations.serviceId} IS NULL`);
  }
  
  if (params.bookingId) {
    conditions.push(eq(chatConversations.bookingId, params.bookingId));
  }
  if (params.orderId) {
    conditions.push(eq(chatConversations.orderId, params.orderId));
  }
  
  console.log(`[getOrCreateConversation] Searching for existing conversation:`, {
    customerId: params.customerId,
    vendorId: params.vendorId,
    serviceId: params.serviceId,
    bookingId: params.bookingId,
    orderId: params.orderId,
  });
  
  const [existing] = await db.select()
    .from(chatConversations)
    .where(and(...conditions))
    .limit(1);
  
  if (existing) {
    console.log(`[getOrCreateConversation] Found existing conversation:`, {
      id: existing.id,
      serviceId: existing.serviceId,
      requestedServiceId: params.serviceId,
      status: existing.status,
      matches: existing.serviceId === params.serviceId,
    });
    
    // CRITICAL CHECK: If serviceId was provided, ensure the existing conversation has the SAME serviceId
    // If not, this is a different service and we need a new conversation
    if (params.serviceId && existing.serviceId !== params.serviceId) {
      console.log(`[getOrCreateConversation] Existing conversation has different serviceId (${existing.serviceId} vs ${params.serviceId}), creating new conversation`);
      // Proceed to create new conversation for this different service
    } else if (existing.status === 'blocked') {
      console.log(`[getOrCreateConversation] Existing conversation is blocked, creating new one`);
      // Proceed to create new conversation
    } else if (existing.status === 'active') {
      // Return existing active conversation with relations loaded
      console.log(`[getOrCreateConversation] Returning existing active conversation for serviceId ${existing.serviceId}`);
      return await getConversationById(existing.id, params.customerId) as typeof chatConversations.$inferSelect;
    }
  } else {
    console.log(`[getOrCreateConversation] No existing conversation found for serviceId ${params.serviceId || 'NULL'}, will create new one`);
  }
  
  // Create new conversation (either no existing one, or existing one is blocked/archived)
  console.log(`[getOrCreateConversation] Creating new conversation:`, {
    customerId: params.customerId,
    vendorId: params.vendorId,
    serviceId: params.serviceId,
  });
  
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
  
  console.log(`[getOrCreateConversation] Created conversation:`, {
    id: conversation.id,
    customerId: conversation.customerId,
    vendorId: conversation.vendorId,
    status: conversation.status,
  });
  
  // Fetch relations for the new conversation
  const fullConversation = await getConversationById(conversation.id, params.customerId) as typeof chatConversations.$inferSelect;
  console.log(`[getOrCreateConversation] Returning conversation with relations:`, {
    id: fullConversation?.id,
    hasVendor: !!fullConversation?.vendorId,
    hasCustomer: !!fullConversation?.customerId,
    hasService: !!fullConversation?.serviceId,
  });
  
  return fullConversation;
}

/**
 * Get conversations for a user
 */
export async function getUserConversations(
  userId: string,
  role: 'customer' | 'vendor' | 'both' = 'both',
  limit: number = 20,
  offset: number = 0,
  options?: {
    status?: 'active' | 'archived' | 'expired' | 'all';
    savedOnly?: boolean; // Only conversations for saved services
  }
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

  // Get blocked users to exclude their conversations
  const blockedUsers = await db.select({ blockedUserId: userBlocks.blockedUserId })
    .from(userBlocks)
    .where(eq(userBlocks.blockerId, userId));
  const blockedUserIds = blockedUsers.map(b => b.blockedUserId);

  // Build status condition
  let statusCondition;
  if (options?.status === 'active') {
    statusCondition = eq(chatConversations.status, 'active');
  } else if (options?.status === 'archived') {
    statusCondition = eq(chatConversations.status, 'archived');
  } else if (options?.status === 'expired') {
    // Expired = conversations with services that are expired/paused
    // We'll filter this in the application layer after fetching
    statusCondition = sql`1=1`; // Match all, filter later
  } else if (options?.status === 'all') {
    // 'all' - show all conversations except blocked status
    statusCondition = sql`${chatConversations.status} != 'blocked'`;
  } else {
    // undefined - default to active only
    statusCondition = eq(chatConversations.status, 'active');
  }

  // If savedOnly, get saved service IDs
  let savedServiceIds: string[] = [];
  if (options?.savedOnly) {
    const saved = await db.select({ serviceId: favorites.serviceId })
      .from(favorites)
      .where(eq(favorites.userId, userId));
    savedServiceIds = saved.map(s => s.serviceId).filter(Boolean); // Filter out any null/undefined
    
    console.log(`[getUserConversations] Saved only mode: found ${savedServiceIds.length} saved services`);
    
    if (savedServiceIds.length === 0) {
      // No saved services, return empty array immediately
      console.log(`[getUserConversations] No saved services found, returning empty array`);
      return [];
    }
  }
  
  // Debug: Log the condition being used
  console.log(`[getUserConversations] Querying conversations for user ${userId} with role ${role}`, {
    status: options?.status,
    savedOnly: options?.savedOnly,
    savedServiceCount: savedServiceIds.length,
  });
  
  const whereConditions = [condition, statusCondition];
  
  // Exclude conversations with blocked users (unless viewing archived or 'all')
  // 'All' tab should show everything including archived conversations with blocked users
  if (blockedUserIds.length > 0 && options?.status !== 'archived' && options?.status !== 'all') {
    // Don't exclude if viewing archived or 'all' (we want to see all conversations)
    // But we still want to exclude active conversations with blocked users from active tab
    if (options?.status === 'active' || !options?.status) {
      // For each blocked user, exclude conversations where they are the other party
      for (const blockedId of blockedUserIds) {
        whereConditions.push(
          sql`NOT (
            (${chatConversations.customerId} = ${userId} AND ${chatConversations.vendorId} = ${blockedId})
            OR
            (${chatConversations.vendorId} = ${userId} AND ${chatConversations.customerId} = ${blockedId})
          )`
        );
      }
    }
  }

  // Filter by saved services if requested
  if (options?.savedOnly && savedServiceIds.length > 0) {
    whereConditions.push(inArray(chatConversations.serviceId, savedServiceIds));
  }
  
  const conversations = await db.query.chatConversations.findMany({
    where: and(...whereConditions),
    orderBy: [
      desc(chatConversations.lastMessageAt),
      desc(chatConversations.updatedAt), // Fallback to updatedAt if lastMessageAt is null
      desc(chatConversations.createdAt) // Final fallback
    ],
    limit: limit,
    offset: offset,
    with: {
      vendor: true,
      customer: true,
      service: true,
    }
  });
  
  // Filter expired conversations if requested
  let filteredConversations = conversations;
  if (options?.status === 'expired') {
    filteredConversations = conversations.filter(conv => {
      if (!conv.service) return false;
      // Check if service is expired or paused
      if (conv.service && typeof conv.service === 'object' && !Array.isArray(conv.service) && 'status' in conv.service) {
        return conv.service.status === 'expired' || conv.service.status === 'paused';
      }
      return false;
    });
  }

  console.log(`[getUserConversations] Found ${filteredConversations.length} conversations for user ${userId} with role ${role}`, {
    status: options?.status,
    savedOnly: options?.savedOnly,
  });
  
  return filteredConversations;
}

/**
 * Get a conversation by ID (with access check)
 */
export async function getConversationById(
  conversationId: string,
  userId: string
) {
  const conversation = await db.query.chatConversations.findFirst({
    where: and(
      eq(chatConversations.id, conversationId),
      or(
        eq(chatConversations.customerId, userId),
        eq(chatConversations.vendorId, userId)
      )
    ),
    with: {
      vendor: true,
      customer: true,
      service: true,
    }
  });
  
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
 * Delete a conversation (soft delete - archives it)
 */
export async function deleteConversation(
  conversationId: string,
  userId: string
): Promise<boolean> {
  // First verify the conversation exists and user has access
  const conversation = await getConversationById(conversationId, userId);
  
  if (!conversation) {
    throw new Error('Conversation not found or access denied');
  }
  
  // Hard delete: Delete all messages first (cascade will handle this, but explicit for clarity)
  await db.delete(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId));
  
  // Hard delete the conversation itself
  const result = await db.delete(chatConversations)
    .where(eq(chatConversations.id, conversationId))
    .returning();
  
  if (!result || result.length === 0) {
    throw new Error('Failed to delete conversation');
  }
  
  return true;
}

/**
 * Block a user - archives all conversations with that user
 */
export async function blockUser(
  blockerId: string,
  blockedUserId: string,
  reason?: string
) {
  // Prevent blocking yourself
  if (blockerId === blockedUserId) {
    throw new Error('Cannot block yourself');
  }

  // Check if already blocked
  const [existing] = await db.select()
    .from(userBlocks)
    .where(
      and(
        eq(userBlocks.blockerId, blockerId),
        eq(userBlocks.blockedUserId, blockedUserId)
      )
    )
    .limit(1);

  if (existing) {
    throw new Error('User is already blocked');
  }

  // Create user block record
  await db.insert(userBlocks)
    .values({
      blockerId,
      blockedUserId,
      reason: reason || 'Blocked by user',
      blockType: 'chat_only',
    });

  // Archive ALL conversations with the blocked user
  const conversationsToArchive = await db.select()
    .from(chatConversations)
    .where(
      or(
        and(
          eq(chatConversations.customerId, blockerId),
          eq(chatConversations.vendorId, blockedUserId)
        ),
        and(
          eq(chatConversations.customerId, blockedUserId),
          eq(chatConversations.vendorId, blockerId)
        )
      )
    );

  if (conversationsToArchive.length > 0) {
    await db.update(chatConversations)
      .set({
        status: 'archived',
        updatedAt: new Date(),
      })
      .where(
        or(
          and(
            eq(chatConversations.customerId, blockerId),
            eq(chatConversations.vendorId, blockedUserId)
          ),
          and(
            eq(chatConversations.customerId, blockedUserId),
            eq(chatConversations.vendorId, blockerId)
          )
        )
      );
  }

  console.log(`[blockUser] Blocked user ${blockedUserId} by ${blockerId}, archived ${conversationsToArchive.length} conversations`);
}

/**
 * Unblock a user - restores all archived conversations with that user
 */
export async function unblockUser(
  blockerId: string,
  blockedUserId: string
) {
  // Find the block record
  const [block] = await db.select()
    .from(userBlocks)
    .where(
      and(
        eq(userBlocks.blockerId, blockerId),
        eq(userBlocks.blockedUserId, blockedUserId)
      )
    )
    .limit(1);

  if (!block) {
    throw new Error('User is not blocked');
  }

  // Delete the block record
  await db.delete(userBlocks)
    .where(
      and(
        eq(userBlocks.blockerId, blockerId),
        eq(userBlocks.blockedUserId, blockedUserId)
      )
    );

  // Restore ALL archived conversations with the unblocked user
  const restored = await db.update(chatConversations)
    .set({
      status: 'active',
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(chatConversations.status, 'archived'),
        or(
          and(
            eq(chatConversations.customerId, blockerId),
            eq(chatConversations.vendorId, blockedUserId)
          ),
          and(
            eq(chatConversations.customerId, blockedUserId),
            eq(chatConversations.vendorId, blockerId)
          )
        )
      )
    )
    .returning();

  console.log(`[unblockUser] Unblocked user ${blockedUserId} by ${blockerId}, restored ${restored.length} conversations`);
}

/**
 * Get list of blocked users for a user
 */
export async function getBlockedUsers(userId: string) {
  const blocks = await db.select()
    .from(userBlocks)
    .where(eq(userBlocks.blockerId, userId));

  if (blocks.length === 0) {
    return [];
  }

  // Get user details for blocked users
  const blockedUserIds = blocks.map(b => b.blockedUserId);
  const blockedUsers = await db.select()
    .from(users)
    .where(inArray(users.id, blockedUserIds));

  return blockedUsers;
}

/**
 * Block a conversation (admin or either party)
 * DEPRECATED: Use blockUser instead - this function now calls blockUser internally
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

  // Get the other party's ID
  const otherPartyId = conversation.customerId === userId 
    ? conversation.vendorId 
    : conversation.customerId;

  // Use the new blockUser function to block the user and archive all conversations
  return await blockUser(userId, otherPartyId, reason);
}

/**
 * Unblock a conversation (admin or the user who blocked it)
 */
export async function unblockConversation(
  conversationId: string,
  userId: string
) {
  const conversation = await getConversationById(conversationId, userId);
  
  if (!conversation) {
    throw new Error('Conversation not found or access denied');
  }

  // Get the other party's ID
  const otherPartyId = conversation.customerId === userId 
    ? conversation.vendorId 
    : conversation.customerId;

  // Use the new unblockUser function to unblock the user and restore all conversations
  return await unblockUser(userId, otherPartyId);
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

