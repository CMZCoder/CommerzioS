#!/usr/bin/env node
/**
 * Database Reset and Reseed Script
 * 
 * This script completely resets the database and repopulates it with fresh test data.
 * WARNING: This will delete ALL existing data!
 */

import { resetDatabase, seedDatabase } from "../server/seed.js";
import { seedAdminIfNeeded } from "../server/adminAuth.js";

async function main() {
  try {
    console.log("==========================================");
    console.log("🗑️  DATABASE RESET & RESEED SCRIPT");
    console.log("==========================================");
    console.log("⚠️  WARNING: This will delete ALL existing data!");
    console.log("");
    
    // Check environment
    if (process.env.NODE_ENV === "production") {
      console.error("❌ ERROR: Cannot reset database in PRODUCTION environment!");
      console.error("   Set NODE_ENV=development to proceed.");
      process.exit(1);
    }

    // Step 1: Reset database
    console.log("Step 1/3: Resetting database...");
    await resetDatabase(true);
    console.log("✅ Database reset complete!");
    console.log("");

    // Step 2: Seed fresh data
    console.log("Step 2/3: Seeding fresh data...");
    await seedDatabase();
    console.log("✅ Database seeding complete!");
    console.log("");

    // Step 3: Seed admin user
    console.log("Step 3/3: Creating admin user...");
    await seedAdminIfNeeded();
    console.log("✅ Admin user ready!");
    console.log("");

    console.log("==========================================");
    console.log("✅ DATABASE RESET & RESEED COMPLETE!");
    console.log("==========================================");
    console.log("");
    console.log("Fresh data includes:");
    console.log("  • 10 demo users with locations");
    console.log("  • 46 services/products with images");
    console.log("  • 45 reviews");
    console.log("  • Chat conversations and messages");
    console.log("  • Notifications");
    console.log("  • Categories and subcategories");
    console.log("  • Marketing plans");
    console.log("");

    process.exit(0);
  } catch (error) {
    console.error("❌ ERROR during database reset/reseed:", error);
    process.exit(1);
  }
}

main();

