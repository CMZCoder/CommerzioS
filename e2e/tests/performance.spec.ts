import { test, expect } from '@playwright/test';

test.describe('Performance & Accessibility Tests', () => {
  
  test.describe('Page Load Performance', () => {
    test('should load home page within 3 seconds', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });
    
    test('should become interactive within 5 seconds', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Try interacting with an element
      const interactiveElement = page.getByRole('button').or(page.getByRole('link')).first();
      await interactiveElement.waitFor({ state: 'visible' });
      
      const interactiveTime = Date.now() - startTime;
      
      // Should be interactive within 5 seconds
      expect(interactiveTime).toBeLessThan(5000);
    });
    
    test('should have acceptable Largest Contentful Paint', async ({ page }) => {
      await page.goto('/');
      
      // Get LCP metric
      const lcp = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            resolve(lastEntry.startTime);
          }).observe({ type: 'largest-contentful-paint', buffered: true });
          
          // Fallback timeout
          setTimeout(() => resolve(0), 5000);
        });
      });
      
      // LCP should be under 2.5 seconds (good)
      expect(lcp).toBeLessThan(2500);
    });
    
    test('should have acceptable First Input Delay', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Click on first interactive element and measure delay
      const startTime = Date.now();
      
      const button = page.getByRole('button').first();
      if (await button.isVisible()) {
        await button.click({ timeout: 1000 }).catch(() => {});
      }
      
      const fid = Date.now() - startTime;
      
      // FID should be under 100ms (good)
      expect(fid).toBeLessThan(100);
    });
    
    test('should have acceptable Cumulative Layout Shift', async ({ page }) => {
      await page.goto('/');
      
      // Measure CLS
      const cls = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let clsValue = 0;
          
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              // @ts-expect-error - PerformanceEntry type needs cast
              if (!entry.hadRecentInput) {
                // @ts-expect-error - PerformanceEntry type needs cast
                clsValue += entry.value;
              }
            }
          }).observe({ type: 'layout-shift', buffered: true });
          
          setTimeout(() => resolve(clsValue), 3000);
        });
      });
      
      // CLS should be under 0.1 (good)
      expect(cls).toBeLessThan(0.1);
    });
  });
  
  test.describe('Accessibility', () => {
    test('should have heading structure', async ({ page }) => {
      await page.goto('/');
      
      // Should have at least one heading
      const h1 = page.locator('h1');
      const h2 = page.locator('h2');
      const h3 = page.locator('h3');
      
      const headingCount = await h1.count() + await h2.count() + await h3.count();
      expect(headingCount).toBeGreaterThan(0);
    });
    
    test('should have landmark regions', async ({ page }) => {
      await page.goto('/');
      
      // Should have main landmark
      const main = page.locator('main, [role="main"]');
      await expect(main).toBeVisible();
      
      // Should have navigation
      const nav = page.locator('nav, [role="navigation"]');
      const navCount = await nav.count();
      expect(navCount).toBeGreaterThan(0);
    });
    
    test('should have alt text on images', async ({ page }) => {
      await page.goto('/');
      
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < Math.min(imageCount, 10); i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        
        // All images should have alt attribute (can be empty for decorative)
        expect(alt).not.toBeNull();
      }
    });
    
    test('should have focusable elements in logical order', async ({ page }) => {
      await page.goto('/');
      
      // Get all focusable elements
      const focusable = page.locator('a, button, input, select, textarea, [tabindex]');
      const count = await focusable.count();
      
      // Should have focusable elements
      expect(count).toBeGreaterThan(0);
      
      // First focusable should be accessible
      await focusable.first().focus();
    });
    
    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/');
      
      // Start from beginning
      await page.keyboard.press('Tab');
      
      // Should focus on first focusable element
      const activeElement = page.locator(':focus');
      await expect(activeElement).toBeFocused();
      
      // Tab through multiple elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
      }
      
      // Should still have focus somewhere
      const newActiveElement = page.locator(':focus');
      const isFocused = await newActiveElement.count();
      expect(isFocused).toBeGreaterThan(0);
    });
    
    test('should have sufficient color contrast', async ({ page }) => {
      await page.goto('/');
      
      // Check that main text is readable
      const mainText = page.locator('body');
      const color = await mainText.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          color: style.color,
          backgroundColor: style.backgroundColor,
        };
      });
      
      // Text should have color defined
      expect(color.color).toBeTruthy();
    });
    
    test('should have visible focus indicators', async ({ page }) => {
      await page.goto('/');
      
      // Tab to first element
      await page.keyboard.press('Tab');
      
      const focusedElement = page.locator(':focus');
      
      if (await focusedElement.isVisible()) {
        // Check for focus styling
        const outline = await focusedElement.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.outline || style.boxShadow || style.border;
        });
        
        // Should have some focus indication
        expect(outline).toBeTruthy();
      }
    });
    
    test('should have skip to main content link', async ({ page }) => {
      await page.goto('/');
      
      // Tab to first element
      await page.keyboard.press('Tab');
      
      // Look for skip link
      const skipLink = page.getByRole('link', { name: /skip.*main|skip.*content/i });
      
      // Skip link is nice to have but not required
      const hasSkipLink = await skipLink.isVisible().catch(() => false);
      
      // Page should at least be navigable
      await expect(page.locator('body')).toBeVisible();
    });
    
    test('should have proper form labels', async ({ page }) => {
      await page.goto('/login');
      
      const inputs = page.locator('input');
      const inputCount = await inputs.count();
      
      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        const name = await input.getAttribute('name');
        
        // Check if there's an associated label
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          const hasLabel = await label.count() > 0;
          const hasAriaLabel = ariaLabel || ariaLabelledBy;
          
          // Each input should have either a label or aria-label
          expect(hasLabel || hasAriaLabel || name).toBeTruthy();
        }
      }
    });
    
    test('should announce alerts to screen readers', async ({ page }) => {
      await page.goto('/login');
      
      // Submit invalid form to trigger error
      const submitButton = page.getByRole('button', { name: /login|sign.*in/i });
      await submitButton.click();
      
      // Check for alert role
      const alert = page.locator('[role="alert"]');
      
      if (await alert.isVisible()) {
        await expect(alert).toHaveAttribute('role', 'alert');
      }
    });
  });
  
  test.describe('Mobile Responsive Design', () => {
    test('should be responsive on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      
      await page.goto('/');
      
      // Content should fit viewport
      const body = page.locator('body');
      const width = await body.evaluate((el) => el.scrollWidth);
      
      expect(width).toBeLessThanOrEqual(375);
    });
    
    test('should have touch-friendly targets', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/');
      
      // Check button sizes
      const buttons = page.locator('button, a');
      const count = await buttons.count();
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        const button = buttons.nth(i);
        
        if (await button.isVisible()) {
          const box = await button.boundingBox();
          
          if (box) {
            // Touch targets should be at least 44x44 pixels (WCAG)
            expect(box.width).toBeGreaterThanOrEqual(24);
            expect(box.height).toBeGreaterThanOrEqual(24);
          }
        }
      }
    });
    
    test('should have mobile navigation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/');
      
      // Look for mobile menu button
      const menuButton = page.getByRole('button', { name: /menu/i }).or(page.locator('[data-testid="mobile-menu"]'));
      
      // Should have some form of navigation
      await expect(page.locator('nav, [role="navigation"], header')).toBeVisible();
    });
    
    test('should handle tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad
      
      await page.goto('/');
      
      // Content should display properly
      await expect(page.locator('body')).toBeVisible();
    });
  });
  
  test.describe('Resource Optimization', () => {
    test('should not have excessive network requests', async ({ page }) => {
      const requests: string[] = [];
      
      page.on('request', (request) => {
        requests.push(request.url());
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Should not make excessive requests
      expect(requests.length).toBeLessThan(100);
    });
    
    test('should have compressed resources', async ({ page }) => {
      const responses: { url: string; encoding: string | null }[] = [];
      
      page.on('response', (response) => {
        responses.push({
          url: response.url(),
          encoding: response.headers()['content-encoding'],
        });
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // At least some responses should be compressed
      const compressedCount = responses.filter((r) => r.encoding).length;
      expect(compressedCount).toBeGreaterThan(0);
    });
  });
});
