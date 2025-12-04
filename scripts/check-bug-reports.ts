/**
 * Check bug reports in the database
 */
import { db } from '../server/db';
import { e2eBugReports } from '../shared/schema';
import { desc } from 'drizzle-orm';

async function main() {
  const reports = await db.select().from(e2eBugReports).orderBy(desc(e2eBugReports.createdAt)).limit(10);
  
  console.log(`\n📋 Bug Reports in Database: ${reports.length}`);
  console.log('=' .repeat(60));
  
  if (reports.length === 0) {
    console.log('No bug reports found (all tests passed!)');
  } else {
    for (const report of reports) {
      console.log(`\n🐛 ${report.testName}`);
      console.log(`   File: ${report.testFile}`);
      console.log(`   Type: ${report.errorType}`);
      console.log(`   Status: ${report.status}`);
      console.log(`   Error: ${report.errorMessage?.substring(0, 100)}...`);
    }
  }
  
  process.exit(0);
}

main();
