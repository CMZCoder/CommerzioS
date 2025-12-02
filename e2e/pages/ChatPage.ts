import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Chat Page Object Model
 */
export class ChatPage extends BasePage {
  // Chat list elements
  readonly conversationList: Locator;
  readonly conversationItems: Locator;
  readonly searchInput: Locator;
  readonly unreadCount: Locator;
  
  // Chat detail elements
  readonly messageList: Locator;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly attachmentButton: Locator;
  readonly typingIndicator: Locator;
  
  // Message elements
  readonly messages: Locator;
  readonly sentMessages: Locator;
  readonly receivedMessages: Locator;
  readonly messageTimestamps: Locator;
  
  // Chat actions
  readonly blockUserButton: Locator;
  readonly reportUserButton: Locator;
  readonly viewBookingButton: Locator;
  readonly closeConversationButton: Locator;
  
  // Status elements
  readonly onlineIndicator: Locator;
  readonly readReceipts: Locator;
  readonly blockedMessage: Locator;
  readonly filteredMessage: Locator;

  constructor(page: Page) {
    super(page);
    // List elements
    this.conversationList = page.locator('[data-testid="conversation-list"]').or(page.locator('.conversation-list'));
    this.conversationItems = page.locator('[data-testid="conversation-item"]').or(page.locator('.conversation-item'));
    this.searchInput = page.getByPlaceholder(/search.*conversation/i).or(page.locator('[data-testid="chat-search"]'));
    this.unreadCount = page.locator('[data-testid="unread-count"]').or(page.locator('.unread-badge'));
    
    // Chat detail
    this.messageList = page.locator('[data-testid="message-list"]').or(page.locator('.message-list'));
    this.messageInput = page.getByPlaceholder(/type.*message|write.*message/i).or(page.locator('textarea[name="message"]'));
    this.sendButton = page.getByRole('button', { name: /send/i }).or(page.locator('[data-testid="send-button"]'));
    this.attachmentButton = page.getByRole('button', { name: /attach/i }).or(page.locator('[data-testid="attachment-button"]'));
    this.typingIndicator = page.locator('[data-testid="typing-indicator"]').or(page.locator('.typing-indicator'));
    
    // Messages
    this.messages = page.locator('[data-testid="message"]').or(page.locator('.message'));
    this.sentMessages = page.locator('[data-testid="message-sent"]').or(page.locator('.message-sent'));
    this.receivedMessages = page.locator('[data-testid="message-received"]').or(page.locator('.message-received'));
    this.messageTimestamps = page.locator('[data-testid="message-timestamp"]').or(page.locator('.message-timestamp'));
    
    // Actions
    this.blockUserButton = page.getByRole('button', { name: /block/i }).or(page.locator('[data-testid="block-user"]'));
    this.reportUserButton = page.getByRole('button', { name: /report/i }).or(page.locator('[data-testid="report-user"]'));
    this.viewBookingButton = page.getByRole('button', { name: /view.*booking/i }).or(page.getByRole('link', { name: /booking/i }));
    this.closeConversationButton = page.getByRole('button', { name: /close/i });
    
    // Status
    this.onlineIndicator = page.locator('[data-testid="online-indicator"]').or(page.locator('.online-indicator'));
    this.readReceipts = page.locator('[data-testid="read-receipt"]').or(page.locator('.read-receipt'));
    this.blockedMessage = page.locator('[data-testid="blocked-message"]').or(page.getByText(/blocked|cannot.*send/i));
    this.filteredMessage = page.locator('[data-testid="filtered-message"]').or(page.getByText(/filtered|inappropriate/i));
  }

  /**
   * Navigate to chat page
   */
  async navigateToChat(): Promise<void> {
    await this.goto('/chat');
  }

  /**
   * Navigate to specific conversation
   */
  async navigateToConversation(conversationId: number): Promise<void> {
    await this.goto(`/chat/${conversationId}`);
  }

  /**
   * Open conversation from list
   */
  async openConversation(participantName: string): Promise<void> {
    const conversation = this.conversationItems.filter({ hasText: participantName });
    await conversation.first().click();
    await this.waitForLoadingComplete();
  }

  /**
   * Send a message
   */
  async sendMessage(text: string): Promise<void> {
    await this.messageInput.fill(text);
    await this.sendButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Get last sent message
   */
  async getLastSentMessage(): Promise<string> {
    const lastSent = this.sentMessages.last();
    const content = await lastSent.textContent();
    return content || '';
  }

  /**
   * Get last received message
   */
  async getLastReceivedMessage(): Promise<string> {
    const lastReceived = this.receivedMessages.last();
    const content = await lastReceived.textContent();
    return content || '';
  }

  /**
   * Get all messages
   */
  async getAllMessages(): Promise<string[]> {
    const texts = await this.messages.allTextContents();
    return texts;
  }

  /**
   * Get messages count
   */
  async getMessagesCount(): Promise<number> {
    return this.messages.count();
  }

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<number> {
    const text = await this.unreadCount.textContent();
    return parseInt(text || '0', 10);
  }

  /**
   * Wait for new message
   */
  async waitForNewMessage(timeout: number = 10000): Promise<void> {
    const initialCount = await this.getMessagesCount();
    await this.page.waitForFunction(
      ([selector, count]) => {
        const messages = document.querySelectorAll(selector);
        return messages.length > count;
      },
      ['[data-testid="message"], .message', initialCount] as const,
      { timeout }
    );
  }

  /**
   * Check if typing indicator is visible
   */
  async isTyping(): Promise<boolean> {
    return this.isVisible(this.typingIndicator);
  }

  /**
   * Block user
   */
  async blockUser(): Promise<void> {
    await this.blockUserButton.click();
    
    // Confirm block action
    const confirmButton = this.page.getByRole('button', { name: /confirm|yes|block/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
    
    await this.waitForLoadingComplete();
  }

  /**
   * Report user
   */
  async reportUser(reason: string): Promise<void> {
    await this.reportUserButton.click();
    
    // Fill report form
    const reasonInput = this.page.getByLabel(/reason/i);
    await reasonInput.fill(reason);
    
    const submitButton = this.page.getByRole('button', { name: /submit|report/i });
    await submitButton.click();
    
    await this.waitForLoadingComplete();
  }

  /**
   * View linked booking
   */
  async viewBooking(): Promise<void> {
    await this.viewBookingButton.click();
    await this.waitForPageLoad();
  }

  /**
   * Check if user is blocked
   */
  async isUserBlocked(): Promise<boolean> {
    return this.isVisible(this.blockedMessage);
  }

  /**
   * Check if message was filtered
   */
  async wasMessageFiltered(): Promise<boolean> {
    return this.isVisible(this.filteredMessage);
  }

  /**
   * Search conversations
   */
  async searchConversations(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.waitForLoadingComplete();
  }

  /**
   * Get conversations count
   */
  async getConversationsCount(): Promise<number> {
    return this.conversationItems.count();
  }

  /**
   * Mark conversation as read
   */
  async markAsRead(): Promise<void> {
    // Typically happens automatically when viewing
    await this.page.waitForTimeout(500);
  }

  /**
   * Check if user is online
   */
  async isUserOnline(): Promise<boolean> {
    return this.isVisible(this.onlineIndicator);
  }

  /**
   * Start new conversation from service page
   */
  async startConversationFromService(serviceId: number): Promise<void> {
    await this.goto(`/services/${serviceId}`);
    const messageButton = this.page.getByRole('button', { name: /message|contact/i });
    await messageButton.click();
    await this.waitForPageLoad();
  }

  /**
   * Start new conversation from booking
   */
  async startConversationFromBooking(bookingId: number): Promise<void> {
    await this.goto(`/bookings/${bookingId}`);
    const messageButton = this.page.getByRole('button', { name: /message|chat/i });
    await messageButton.click();
    await this.waitForPageLoad();
  }

  /**
   * Verify message sent successfully
   */
  async verifyMessageSent(text: string): Promise<void> {
    const sentMessage = this.sentMessages.filter({ hasText: text });
    await expect(sentMessage).toBeVisible();
  }

  /**
   * Verify message received
   */
  async verifyMessageReceived(text: string): Promise<void> {
    const receivedMessage = this.receivedMessages.filter({ hasText: text });
    await expect(receivedMessage).toBeVisible();
  }

  /**
   * Close conversation
   */
  async closeConversation(): Promise<void> {
    await this.closeConversationButton.click();
    await this.waitForPageLoad();
  }
}
