/**
 * E2E Test Global Teardown
 * 
 * Cleans up test data after E2E tests complete.
 * This removes all traces of test interactions.
 * 
 * Uses a dedicated TEST ADMIN account (not your production admin)
 */

import { FullConfig } from '@playwright/test';

// Test admin credentials - isolated from production admin
const TEST_ADMIN_EMAIL = 'test-admin@commerzio.test';
const TEST_ADMIN_PASSWORD = 'TestAdmin123Secure';

async function globalTeardown(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:5000';
  
  // Skip cleanup if explicitly disabled
  if (process.env.SKIP_TEST_CLEANUP === 'true') {
    console.log('[E2E Teardown] Skipping cleanup (SKIP_TEST_CLEANUP=true)');
    return;
  }

  console.log('[E2E Teardown] Cleaning up test data...');
  
  try {
    // Login as TEST admin (not production admin)
    const loginResponse = await fetch(`${baseURL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_ADMIN_EMAIL,
        password: TEST_ADMIN_PASSWORD,
      }),
    });

    if (!loginResponse.ok) {
      console.log('[E2E Teardown] Could not login as test admin - cleanup skipped');
      return;
    }

    const cookies = loginResponse.headers.get('set-cookie');
    
    // Cleanup test data
    const cleanupResponse = await fetch(`${baseURL}/api/admin/test-users/cleanup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || '',
      },
      body: JSON.stringify({ dryRun: false }),
    });

    if (cleanupResponse.ok) {
      const result = await cleanupResponse.json();
      const totalDeleted = Object.values(result.deleted).reduce((a: number, b: any) => a + b, 0);
      console.log('[E2E Teardown] Cleanup complete:', {
        totalRecordsDeleted: totalDeleted,
        details: result.deleted,
      });
    } else {
      console.log('[E2E Teardown] Warning: Cleanup request failed');
    }

  } catch (error) {
    console.log('[E2E Teardown] Warning: Teardown failed');
    console.log('[E2E Teardown] Error:', error instanceof Error ? error.message : error);
  }
}

export default globalTeardown;
