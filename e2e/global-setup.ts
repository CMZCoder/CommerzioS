/**
 * E2E Test Global Setup
 * 
 * Initializes test users before running E2E tests.
 * This ensures the dedicated test accounts exist in the database.
 * 
 * Uses a dedicated TEST ADMIN account (not your production admin)
 * - Email: test-admin@commerzio.test
 * - Password: TestAdmin123!$ecure
 */

import { FullConfig } from '@playwright/test';

// Test admin credentials - isolated from production admin
const TEST_ADMIN_EMAIL = 'test-admin@commerzio.test';
const TEST_ADMIN_PASSWORD = 'TestAdmin123Secure';

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:5000';
  
  console.log('[E2E Setup] Initializing test users...');
  
  try {
    // First, ensure test users exist by calling the public initialization endpoint
    // This creates the test admin if it doesn't exist
    const initFirstResponse = await fetch(`${baseURL}/api/test/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (initFirstResponse.ok) {
      console.log('[E2E Setup] Test users bootstrapped via /api/test/init');
    }

    // Now login as the TEST admin (not production admin)
    const loginResponse = await fetch(`${baseURL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_ADMIN_EMAIL,
        password: TEST_ADMIN_PASSWORD,
      }),
    });

    if (!loginResponse.ok) {
      console.log('[E2E Setup] Could not login as test admin - test users may need manual initialization');
      console.log('[E2E Setup] Test admin credentials: test-admin@commerzio.test / TestAdmin123Secure');
      return;
    }

    // Get cookies from login response
    const cookies = loginResponse.headers.get('set-cookie');
    
    // Initialize test users via admin endpoint
    const initResponse = await fetch(`${baseURL}/api/admin/test-users/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || '',
      },
    });

    if (initResponse.ok) {
      const result = await initResponse.json();
      console.log('[E2E Setup] Test users initialized:', {
        admin: result.users?.admin?.created ? 'created' : 'exists',
        customer: result.users?.customer?.created ? 'created' : 'exists',
        vendor: result.users?.vendor?.created ? 'created' : 'exists',
      });
    } else {
      console.log('[E2E Setup] Warning: Could not initialize test users via admin endpoint');
    }

  } catch (error) {
    console.log('[E2E Setup] Warning: Setup failed, tests may need manual test user creation');
    console.log('[E2E Setup] Error:', error instanceof Error ? error.message : error);
  }
}

export default globalSetup;
