/**
 * Quick script to verify seed data
 */

import { db } from "../server/db";
import { bookings, services, users, reviews, escrowDisputes, notifications, chatConversations } from "../shared/schema";
import { disputePhases } from "../shared/schema-disputes";
import { eq, count, sql } from "drizzle-orm";

async function checkData() {
  console.log("📊 Checking seed data...\n");
  
  // Count records using raw SQL
  const results = await db.execute(sql`
    SELECT 
      (SELECT COUNT(*) FROM bookings) as booking_count,
      (SELECT COUNT(*) FROM services) as service_count,
      (SELECT COUNT(*) FROM reviews) as review_count,
      (SELECT COUNT(*) FROM escrow_disputes) as dispute_count,
      (SELECT COUNT(*) FROM notifications) as notification_count,
      (SELECT COUNT(*) FROM chat_conversations) as chat_count
  `);
  
  const counts = results.rows[0] as any;
  console.log("Record counts:");
  console.log(`  Bookings: ${counts.booking_count}`);
  console.log(`  Services: ${counts.service_count}`);
  console.log(`  Reviews: ${counts.review_count}`);
  console.log(`  Disputes: ${counts.dispute_count}`);
  console.log(`  Notifications: ${counts.notification_count}`);
  console.log(`  Chat Conversations: ${counts.chat_count}`);
  
  // Get sample booking with service via raw SQL
  console.log("\n📅 Sample bookings with linked data:");
  const bookingData = await db.execute(sql`
    SELECT 
      b.id,
      b.booking_number,
      b.status,
      s.title as service_title,
      s.price as service_price,
      u.first_name || ' ' || u.last_name as vendor_name
    FROM bookings b
    LEFT JOIN services s ON s.id = b.service_id
    LEFT JOIN users u ON u.id = b.vendor_id
    LIMIT 5
  `);
  
  for (const row of bookingData.rows as any[]) {
    console.log(`\n  ${row.booking_number}: ${row.status}`);
    console.log(`    Service: ${row.service_title || 'N/A'}`);
    console.log(`    Vendor: ${row.vendor_name || 'N/A'}`);
    console.log(`    Price: ${row.service_price || 'N/A'}`);
  }
  
  // Check dispute phases
  console.log("\n⚖️ Dispute phases:");
  const phaseData = await db.execute(sql`
    SELECT dispute_id, current_phase 
    FROM dispute_phases
  `);
  
  if (phaseData.rows.length === 0) {
    console.log("  No dispute phases found");
  } else {
    for (const row of phaseData.rows as any[]) {
      console.log(`  ${row.dispute_id}: ${row.current_phase}`);
    }
  }
  
  // Check notifications for admin
  console.log("\n🔔 Sample notifications:");
  const notifData = await db.execute(sql`
    SELECT type, title, is_read
    FROM notifications
    WHERE user_id = '8b67c4d0-268b-41f2-8acb-2aa4d9362267'
    LIMIT 5
  `);
  
  for (const row of notifData.rows as any[]) {
    console.log(`  ${row.is_read ? '✓' : '○'} [${row.type}] ${row.title}`);
  }
  
  console.log("\n✅ Check complete!");
  process.exit(0);
}

checkData().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
