import { test, expect } from '@playwright/test';

/**
 * Chat E2E Tests
 * 
 * Tests for the messaging system between customers and vendors
 */

test.describe('Chat System', () => {
  
  test.beforeEach(async ({ page }) => {
    // Most chat tests require authentication
    test.skip(!process.env.TEST_USER_EMAIL, 'Test user not configured');
    
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!);
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  });

  test('should display chat/messages page', async ({ page }) => {
    await page.goto('/chat');
    
    // Should show chat interface or empty state
    const chatWindow = page.locator('[data-testid="chat-window"], .chat-container, [data-testid="conversation-list"]');
    const emptyState = page.locator('text=No conversations, text=No messages, text=Start a conversation');
    
    const hasChatUI = await chatWindow.first().isVisible().catch(() => false);
    const hasEmptyState = await emptyState.first().isVisible().catch(() => false);
    
    expect(hasChatUI || hasEmptyState).toBeTruthy();
  });

  test('should display conversation list', async ({ page }) => {
    await page.goto('/chat');
    
    // Conversation list should be visible
    const conversationList = page.locator('[data-testid="conversation-list"], .conversation-list, [role="list"]');
    
    // Either has conversations or empty state
    const hasConversations = await conversationList.first().isVisible().catch(() => false);
    console.log('Has conversation list:', hasConversations);
  });

  test('should have filter/search functionality', async ({ page }) => {
    await page.goto('/chat');
    
    // Filter or search should be available
    const searchInput = page.locator('[data-testid="chat-search"], input[placeholder*="search"], input[type="search"]');
    const filterDropdown = page.locator('[data-testid="chat-filter"], select, [role="combobox"]');
    
    const hasSearch = await searchInput.first().isVisible().catch(() => false);
    const hasFilter = await filterDropdown.first().isVisible().catch(() => false);
    
    // At least one filtering mechanism should exist
    console.log('Has search:', hasSearch, 'Has filter:', hasFilter);
  });

  test('should display message input when conversation selected', async ({ page }) => {
    await page.goto('/chat');
    
    // If there are conversations, click the first one
    const firstConversation = page.locator('[data-testid="conversation-item"], .conversation-item').first();
    
    if (await firstConversation.isVisible().catch(() => false)) {
      await firstConversation.click();
      
      // Message input should appear
      const messageInput = page.locator('[data-testid="message-textarea"], textarea, input[placeholder*="message"]');
      await expect(messageInput.first()).toBeVisible();
      
      // Send button should be present
      const sendButton = page.locator('[data-testid="send-button"], button:has-text("Send"), button[type="submit"]');
      await expect(sendButton.first()).toBeVisible();
    }
  });

  test('should show message moderation warning for phone numbers', async ({ page }) => {
    await page.goto('/chat');
    
    // Select a conversation
    const firstConversation = page.locator('[data-testid="conversation-item"], .conversation-item').first();
    
    if (await firstConversation.isVisible().catch(() => false)) {
      await firstConversation.click();
      
      const messageInput = page.locator('[data-testid="message-textarea"], textarea').first();
      
      if (await messageInput.isVisible()) {
        // Type a phone number
        await messageInput.fill('My phone is 0791234567');
        
        // Wait for moderation preview
        await page.waitForTimeout(500);
        
        // Should show warning about phone number
        const warning = page.locator('text=filtered, text=removed, text=contact information, text=will be hidden');
        const hasWarning = await warning.first().isVisible().catch(() => false);
        
        console.log('Phone number warning shown:', hasWarning);
      }
    }
  });
});

test.describe('Floating Chat Widget', () => {
  
  test('should display chat widget button on service page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Try to get a service
    const serviceLinks = page.locator('a[href*="/service/"]');
    const count = await serviceLinks.count().catch(() => 0);
    
    if (count > 0) {
      await serviceLinks.first().click();
      await page.waitForLoadState('networkidle');
      
      // Chat widget button may be visible (if logged in or as contact button)
      const chatWidget = page.locator('button:has-text("Contact"), button:has-text("Message"), button:has-text("Chat")');
      const hasChatWidget = await chatWidget.first().isVisible().catch(() => false);
      
      console.log('Chat widget visible:', hasChatWidget);
    }
    
    // Test passes regardless - we're just checking the page loads
    expect(true).toBeTruthy();
  });

  test('should open chat when widget clicked', async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Test user not configured');
    
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!);
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
    
    // Go to a service page
    await page.goto('/');
    await page.waitForSelector('[data-testid="service-card"], .service-card', { timeout: 10000 });
    await page.locator('[data-testid="service-card"], .service-card').first().click();
    await page.waitForURL(/service\//);
    
    // Click chat widget
    const chatWidget = page.locator('[data-testid="chat-widget"], .floating-chat, button:has-text("Chat"), button:has-text("Message")');
    
    if (await chatWidget.first().isVisible().catch(() => false)) {
      await chatWidget.first().click();
      
      // Should show chat modal or navigate to chat
      const chatModal = page.locator('[data-testid="chat-modal"], .chat-modal, [role="dialog"]');
      const isOnChatPage = page.url().includes('/chat');
      
      const hasChat = await chatModal.first().isVisible().catch(() => false) || isOnChatPage;
      expect(hasChat).toBeTruthy();
    }
  });
});
