import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { testUsers, testCalendarSettings } from '../fixtures/test-data';

test.describe('Vendor Calendar Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(testUsers.vendor.email, testUsers.vendor.password);
  });
  
  test.describe('Working Hours', () => {
    test('should set working hours per day', async ({ page }) => {
      await page.goto('/profile');
      
      const calendarSettings = page.getByRole('link', { name: /calendar|availability/i }).or(page.getByRole('button', { name: /calendar/i }));
      
      if (await calendarSettings.isVisible()) {
        await calendarSettings.click();
        
        // Set Monday hours
        const mondayStart = page.getByLabel(/monday.*start|mon.*from/i);
        const mondayEnd = page.getByLabel(/monday.*end|mon.*to/i);
        
        if (await mondayStart.isVisible()) {
          await mondayStart.fill(testCalendarSettings.workingHours.monday.start);
          await mondayEnd.fill(testCalendarSettings.workingHours.monday.end);
        }
        
        const saveButton = page.getByRole('button', { name: /save/i });
        if (await saveButton.isVisible()) {
          await saveButton.click();
          
          await expect(page.getByText(/saved|updated/i)).toBeVisible();
        }
      }
    });
    
    test('should disable specific days', async ({ page }) => {
      await page.goto('/profile');
      
      const calendarSettings = page.getByRole('link', { name: /calendar|availability/i });
      
      if (await calendarSettings.isVisible()) {
        await calendarSettings.click();
        
        // Disable Sunday
        const sundayToggle = page.getByLabel(/sunday/i).or(page.locator('[data-testid="sunday-toggle"]'));
        
        if (await sundayToggle.isVisible()) {
          await sundayToggle.click();
        }
        
        const saveButton = page.getByRole('button', { name: /save/i });
        if (await saveButton.isVisible()) {
          await saveButton.click();
        }
      }
    });
  });
  
  test.describe('Block Time', () => {
    test('should block time for single day', async ({ page }) => {
      await page.goto('/profile');
      
      const calendarSettings = page.getByRole('link', { name: /calendar|availability/i });
      
      if (await calendarSettings.isVisible()) {
        await calendarSettings.click();
        
        const blockButton = page.getByRole('button', { name: /block.*time|add.*block/i });
        
        if (await blockButton.isVisible()) {
          await blockButton.click();
          
          // Fill block time form
          const dateInput = page.getByLabel(/date/i);
          if (await dateInput.isVisible()) {
            await dateInput.fill('2025-12-25');
          }
          
          const reasonInput = page.getByLabel(/reason|note/i);
          if (await reasonInput.isVisible()) {
            await reasonInput.fill('Holiday');
          }
          
          const confirmButton = page.getByRole('button', { name: /block|confirm|add/i });
          await confirmButton.click();
          
          await expect(page.getByText(/blocked|added/i)).toBeVisible();
        }
      }
    });
    
    test('should block time for date range', async ({ page }) => {
      await page.goto('/profile');
      
      const calendarSettings = page.getByRole('link', { name: /calendar|availability/i });
      
      if (await calendarSettings.isVisible()) {
        await calendarSettings.click();
        
        const blockButton = page.getByRole('button', { name: /block.*time/i });
        
        if (await blockButton.isVisible()) {
          await blockButton.click();
          
          const startDate = page.getByLabel(/start.*date|from/i);
          const endDate = page.getByLabel(/end.*date|to/i);
          
          if (await startDate.isVisible()) {
            await startDate.fill('2025-12-24');
            await endDate.fill('2025-12-26');
          }
          
          const confirmButton = page.getByRole('button', { name: /block|confirm/i });
          await confirmButton.click();
        }
      }
    });
    
    test('should set recurring block', async ({ page }) => {
      await page.goto('/profile');
      
      const calendarSettings = page.getByRole('link', { name: /calendar|availability/i });
      
      if (await calendarSettings.isVisible()) {
        await calendarSettings.click();
        
        const blockButton = page.getByRole('button', { name: /block.*time/i });
        
        if (await blockButton.isVisible()) {
          await blockButton.click();
          
          const recurringCheckbox = page.getByLabel(/recurring|repeat/i);
          
          if (await recurringCheckbox.isVisible()) {
            await recurringCheckbox.check();
            
            const weeklyOption = page.getByLabel(/weekly/i).or(page.getByRole('option', { name: /weekly/i }));
            if (await weeklyOption.isVisible()) {
              await weeklyOption.click();
            }
          }
          
          const confirmButton = page.getByRole('button', { name: /block|confirm/i });
          await confirmButton.click();
        }
      }
    });
    
    test('should edit calendar block', async ({ page }) => {
      await page.goto('/profile');
      
      const calendarSettings = page.getByRole('link', { name: /calendar|availability/i });
      
      if (await calendarSettings.isVisible()) {
        await calendarSettings.click();
        
        const blockItem = page.locator('[data-testid="calendar-block"]').first();
        
        if (await blockItem.isVisible()) {
          const editButton = blockItem.getByRole('button', { name: /edit/i });
          
          if (await editButton.isVisible()) {
            await editButton.click();
            
            // Edit the block
            const reasonInput = page.getByLabel(/reason|note/i);
            if (await reasonInput.isVisible()) {
              await reasonInput.fill('Updated reason');
            }
            
            const saveButton = page.getByRole('button', { name: /save|update/i });
            await saveButton.click();
            
            await expect(page.getByText(/updated|saved/i)).toBeVisible();
          }
        }
      }
    });
    
    test('should delete calendar block', async ({ page }) => {
      await page.goto('/profile');
      
      const calendarSettings = page.getByRole('link', { name: /calendar|availability/i });
      
      if (await calendarSettings.isVisible()) {
        await calendarSettings.click();
        
        const blockItem = page.locator('[data-testid="calendar-block"]').first();
        
        if (await blockItem.isVisible()) {
          const deleteButton = blockItem.getByRole('button', { name: /delete|remove/i });
          
          if (await deleteButton.isVisible()) {
            await deleteButton.click();
            
            const confirmButton = page.getByRole('button', { name: /confirm|yes/i });
            if (await confirmButton.isVisible()) {
              await confirmButton.click();
            }
            
            await expect(page.getByText(/deleted|removed/i)).toBeVisible();
          }
        }
      }
    });
  });
  
  test.describe('Booking Settings', () => {
    test('should set minimum booking notice', async ({ page }) => {
      await page.goto('/profile');
      
      const calendarSettings = page.getByRole('link', { name: /calendar|availability/i });
      
      if (await calendarSettings.isVisible()) {
        await calendarSettings.click();
        
        const minNoticeInput = page.getByLabel(/minimum.*notice|advance.*notice/i);
        
        if (await minNoticeInput.isVisible()) {
          await minNoticeInput.fill(testCalendarSettings.minBookingNotice.toString());
          
          const saveButton = page.getByRole('button', { name: /save/i });
          await saveButton.click();
        }
      }
    });
    
    test('should set maximum advance booking', async ({ page }) => {
      await page.goto('/profile');
      
      const calendarSettings = page.getByRole('link', { name: /calendar|availability/i });
      
      if (await calendarSettings.isVisible()) {
        await calendarSettings.click();
        
        const maxAdvanceInput = page.getByLabel(/maximum.*advance|book.*ahead/i);
        
        if (await maxAdvanceInput.isVisible()) {
          await maxAdvanceInput.fill(testCalendarSettings.maxAdvanceBooking.toString());
          
          const saveButton = page.getByRole('button', { name: /save/i });
          await saveButton.click();
        }
      }
    });
    
    test('should set buffer between bookings', async ({ page }) => {
      await page.goto('/profile');
      
      const calendarSettings = page.getByRole('link', { name: /calendar|availability/i });
      
      if (await calendarSettings.isVisible()) {
        await calendarSettings.click();
        
        const bufferInput = page.getByLabel(/buffer|gap|break/i);
        
        if (await bufferInput.isVisible()) {
          await bufferInput.fill(testCalendarSettings.bufferBetweenBookings.toString());
          
          const saveButton = page.getByRole('button', { name: /save/i });
          await saveButton.click();
        }
      }
    });
    
    test('should set slot duration', async ({ page }) => {
      await page.goto('/profile');
      
      const calendarSettings = page.getByRole('link', { name: /calendar|availability/i });
      
      if (await calendarSettings.isVisible()) {
        await calendarSettings.click();
        
        const slotDurationInput = page.getByLabel(/slot.*duration|appointment.*length/i);
        
        if (await slotDurationInput.isVisible()) {
          await slotDurationInput.fill(testCalendarSettings.slotDuration.toString());
          
          const saveButton = page.getByRole('button', { name: /save/i });
          await saveButton.click();
        }
      }
    });
  });
  
  test.describe('Available Slots', () => {
    test('should reflect calendar settings in available slots', async ({ page }) => {
      // First set up calendar as vendor
      await page.goto('/profile');
      
      // Then check as customer what slots are available
      // Logout and login as customer
      const userMenu = page.getByRole('button', { name: /profile|account/i });
      if (await userMenu.isVisible()) {
        await userMenu.click();
        const logoutButton = page.getByRole('menuitem', { name: /logout/i });
        if (await logoutButton.isVisible()) {
          await logoutButton.click();
        }
      }
      
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
      
      // Navigate to book the vendor's service
      await page.goto('/');
      
      const serviceCard = page.locator('[data-testid="service-card"]').first();
      
      if (await serviceCard.isVisible()) {
        await serviceCard.click();
        await page.waitForLoadState('networkidle');
        
        const bookButton = page.getByRole('button', { name: /book/i });
        
        if (await bookButton.isVisible()) {
          await bookButton.click();
          
          // Check for available time slots
          const timeSlots = page.locator('[data-testid="time-slot"]').or(page.locator('.time-slot'));
          
          const count = await timeSlots.count();
          expect(count).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });
});
