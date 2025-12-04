import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Playwright E2E Test Configuration
 * 
 * Run tests with: npx playwright test
 * Run specific test: npx playwright test e2e/auth.spec.ts
 * Run with UI: npx playwright test --ui
 * Debug mode: npx playwright test --debug
 * 
 * Environment Variables:
 * - SKIP_TEST_CLEANUP=true - Skip cleanup after tests
 * - ADMIN_EMAIL - Admin email for test setup (default: admin@commerzio.online)
 * - ADMIN_PASSWORD - Admin password for test setup (default: commerzio1A$$)
 */

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4, // Reduced workers to prevent server overload
  reporter: 'html',
  timeout: 60000, // 60 second timeout per test (increased from 30s)
  
  // Global setup initializes test users before tests run
  globalSetup: resolve(__dirname, './e2e/global-setup.ts'),
  
  // Global teardown cleans up test data after tests complete
  globalTeardown: resolve(__dirname, './e2e/global-teardown.ts'),
  
  use: {
    baseURL: 'http://localhost:5000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000, // 10 second timeout for actions
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run local dev server before starting tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5000',
    reuseExistingServer: true, // Use existing server if running
    timeout: 180 * 1000, // 3 minutes for server startup
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
