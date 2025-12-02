import { FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright tests
 * Runs once before all tests
 */
async function globalSetup(config: FullConfig): Promise<void> {
  console.log('🚀 Starting global test setup...');
  
  // Get base URL from config
  const baseURL = config.projects[0].use?.baseURL || 'http://localhost:5000';
  
  console.log(`📍 Base URL: ${baseURL}`);
  
  // Additional setup tasks can be added here:
  // - Database seeding
  // - Authentication state caching
  // - Environment variable validation
  
  console.log('✅ Global setup complete');
}

export default globalSetup;
