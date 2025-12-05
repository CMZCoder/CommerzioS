#!/usr/bin/env node
/**
 * Seed Test Data for marcelpavel64@gmail.com
 * 
 * Creates 5 services and ~3 bookings per service for testing purposes.
 */

import { db } from "../server/db.js";
import { users, services, servicePricingOptions, bookings, categories, escrowTransactions } from "../shared/schema.js";
import { eq, and, sql } from "drizzle-orm";

const MARCEL_EMAIL = "marcelpavel64@gmail.com";

// Service templates for Marcel
const SERVICE_TEMPLATES = [
  {
    title: "Professional Guitar Lessons",
    description: "Learn guitar from a passionate musician. From beginner chords to advanced techniques, I'll help you master the guitar at your own pace.",
    type: "hourly" as const,
    pricing: { hourly: 45, twoHours: 80, halfDay: 150 },
    categorySlug: "music-lessons",
  },
  {
    title: "Home PC Repair & Setup",
    description: "Fast and reliable computer repair services. I fix hardware issues, remove viruses, optimize performance, and help with setup.",
    type: "fixed" as const,
    pricing: { basic: 50, standard: 80, premium: 120 },
    categorySlug: "computer-repair",
  },
  {
    title: "Dog Walking & Pet Sitting",
    description: "Loving care for your furry friends! Daily walks, feeding, playtime, and overnight pet sitting available.",
    type: "hourly" as const,
    pricing: { hourly: 20, halfDay: 60, fullDay: 100 },
    categorySlug: "pet-services",
  },
  {
    title: "Moving & Furniture Assembly",
    description: "Strong hands for your moving needs. I help with small moves, furniture assembly, and heavy lifting around the house.",
    type: "hourly" as const,
    pricing: { hourly: 35, twoHours: 60, halfDay: 120 },
    categorySlug: "moving-help",
  },
  {
    title: "Language Tutoring - German/English",
    description: "Native-level tutoring in German and English. Great for beginners, exam prep, or business communication.",
    type: "hourly" as const,
    pricing: { hourly: 40, package5: 175, package10: 320 },
    categorySlug: "language-tutoring",
  },
];

// Sample customers for bookings
const SAMPLE_CUSTOMERS = [
  { email: "customer1@test.com", firstName: "Anna", lastName: "Mueller" },
  { email: "customer2@test.com", firstName: "Thomas", lastName: "Schneider" },
  { email: "customer3@test.com", firstName: "Lisa", lastName: "Weber" },
  { email: "customer4@test.com", firstName: "Michael", lastName: "Brunner" },
  { email: "customer5@test.com", firstName: "Sarah", lastName: "Fischer" },
];

async function seedMarcelTestData() {
  console.log("==========================================");
  console.log("🧪 SEEDING TEST DATA FOR MARCEL");
  console.log("==========================================\n");

  // Step 1: Find or inform about Marcel's account
  const [marcel] = await db.select().from(users).where(eq(users.email, MARCEL_EMAIL)).limit(1);
  
  if (!marcel) {
    console.error(`❌ User ${MARCEL_EMAIL} not found!`);
    console.log("   Please ensure this account exists first.");
    process.exit(1);
  }

  console.log(`✅ Found user: ${marcel.firstName} ${marcel.lastName} (${marcel.id})\n`);

  // Step 2: Create sample customers if they don't exist
  console.log("Step 1/4: Creating sample customers...");
  const customerIds: string[] = [];
  
  for (const customer of SAMPLE_CUSTOMERS) {
    const [existing] = await db.select().from(users).where(eq(users.email, customer.email)).limit(1);
    if (existing) {
      customerIds.push(existing.id);
      console.log(`   Using existing customer: ${customer.email}`);
    } else {
      const [newCustomer] = await db.insert(users).values({
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        passwordHash: "$2a$10$test-hash-placeholder", // They won't be able to log in
        isEmailVerified: true,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      customerIds.push(newCustomer.id);
      console.log(`   Created customer: ${customer.email}`);
    }
  }
  console.log("");

  // Step 3: Get or create necessary categories
  console.log("Step 2/4: Checking categories...");
  const categoryMap = new Map<string, string>();
  
  for (const template of SERVICE_TEMPLATES) {
    const [cat] = await db.select().from(categories).where(eq(categories.slug, template.categorySlug)).limit(1);
    if (cat) {
      categoryMap.set(template.categorySlug, cat.id);
      console.log(`   Found category: ${template.categorySlug} (${cat.id})`);
    } else {
      // Use a default category if specific one doesn't exist
      const [defaultCat] = await db.select().from(categories).limit(1);
      if (defaultCat) {
        categoryMap.set(template.categorySlug, defaultCat.id);
        console.log(`   Using default category for: ${template.categorySlug}`);
      }
    }
  }
  console.log("");

  // Step 4: Create services for Marcel
  console.log("Step 3/4: Creating services...");
  const createdServiceIds: string[] = [];

  for (const template of SERVICE_TEMPLATES) {
    const categoryId = categoryMap.get(template.categorySlug);
    if (!categoryId) {
      console.log(`   ⚠️ Skipping ${template.title} - no category found`);
      continue;
    }

    // Check if service already exists
    const [existing] = await db.select().from(services)
      .where(and(
        eq(services.ownerId, marcel.id),
        eq(services.title, template.title)
      ))
      .limit(1);

    if (existing) {
      createdServiceIds.push(existing.id);
      console.log(`   Using existing service: ${template.title}`);
      continue;
    }

    // Create the service
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Expires in 1 year
    
    const [newService] = await db.insert(services).values({
      title: template.title,
      description: template.description,
      categoryId,
      ownerId: marcel.id,
      status: "active",
      primaryLocation: marcel.primaryLocation || "Zürich, Switzerland",
      primaryCoordinates: marcel.primaryCoordinates || { lat: 47.3769, lng: 8.5417 },
      serviceArea: ["Zürich", "Winterthur", "Baden"],
      serviceRadius: 25,
      contactEmail: marcel.email,
      contactPhone: marcel.phone || "+41 79 123 4567",
      pricingType: template.type,
      priceUnit: template.type === "hourly" ? "hour" : "job",
      images: [],
      createdAt: new Date(),
      expiresAt,
      updatedAt: new Date(),
    }).returning();

    createdServiceIds.push(newService.id);
    console.log(`   ✅ Created service: ${template.title} (${newService.id})`);

    // Create pricing options
    const pricingEntries = Object.entries(template.pricing);
    for (const [optionName, price] of pricingEntries) {
      const label = optionName
        .replace(/([A-Z])/g, ' $1')
        .replace(/(\d+)/g, ' $1 ')
        .trim()
        .replace(/\s+/g, ' ');
      
      await db.insert(servicePricingOptions).values({
        serviceId: newService.id,
        label: label.charAt(0).toUpperCase() + label.slice(1), // Capitalize first letter
        description: `${label} pricing option`,
        price: price.toString(),
        currency: "CHF",
        billingInterval: template.type === "hourly" ? "hourly" : "one_time",
        durationMinutes: optionName === "hourly" ? 60 : optionName === "twoHours" ? 120 : 240,
        isActive: true,
      });
    }
  }
  console.log("");

  // Step 5: Create bookings for each service
  console.log("Step 4/4: Creating bookings...");
  const statuses = ["completed", "completed", "pending"] as const;
  let bookingCount = 0;

  for (const serviceId of createdServiceIds) {
    // Get the service info
    const [service] = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
    if (!service) continue;

    // Get first pricing option
    const [pricingOption] = await db.select().from(servicePricingOptions)
      .where(eq(servicePricingOptions.serviceId, serviceId))
      .limit(1);

    // Create 2-3 bookings per service
    const numBookings = Math.floor(Math.random() * 2) + 2; // 2-3 bookings
    
    for (let i = 0; i < numBookings; i++) {
      const customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
      const status = statuses[i] || "completed";
      const daysAgo = Math.floor(Math.random() * 30) + 1;
      const bookingDate = new Date();
      bookingDate.setDate(bookingDate.getDate() - daysAgo);
      
      const startTime = new Date(bookingDate);
      startTime.setHours(10 + Math.floor(Math.random() * 6), 0, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + 2);

      // Generate unique booking number
      const bookingNumber = `BK${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

      try {
        const [newBooking] = await db.insert(bookings).values({
          bookingNumber,
          customerId,
          vendorId: marcel.id,
          serviceId,
          pricingOptionId: pricingOption?.id || null,
          paymentMethod: "card",
          requestedStartTime: startTime,
          requestedEndTime: endTime,
          confirmedStartTime: status !== "pending" ? startTime : null,
          confirmedEndTime: status !== "pending" ? endTime : null,
          status,
          customerMessage: "Looking forward to the service!",
          completedAt: status === "completed" ? bookingDate : null,
          createdAt: new Date(bookingDate.getTime() - 86400000), // 1 day before
          updatedAt: bookingDate,
        }).returning();

        bookingCount++;
        console.log(`   ✅ Created booking: ${bookingNumber} for ${service.title} (${status})`);

        // Create escrow transaction for completed card bookings
        if (status === "completed" && pricingOption) {
          await db.insert(escrowTransactions).values({
            bookingId: newBooking.id,
            customerId,
            vendorId: marcel.id,
            amount: pricingOption.price,
            currency: pricingOption.currency,
            platformFee: (parseFloat(pricingOption.price) * 0.05).toFixed(2),
            vendorAmount: (parseFloat(pricingOption.price) * 0.95).toFixed(2),
            status: "released",
            releasedAt: bookingDate,
            createdAt: new Date(bookingDate.getTime() - 86400000),
            updatedAt: bookingDate,
          });
        }
      } catch (error: any) {
        // Likely duplicate booking number, skip
        console.log(`   ⚠️ Skipped booking (may already exist)`);
      }
    }
  }
  console.log("");

  console.log("==========================================");
  console.log("✅ TEST DATA SEEDING COMPLETE!");
  console.log("==========================================");
  console.log(`\nSummary:`);
  console.log(`  • User: ${MARCEL_EMAIL}`);
  console.log(`  • Services created/found: ${createdServiceIds.length}`);
  console.log(`  • Bookings created: ${bookingCount}`);
  console.log(`  • Sample customers: ${customerIds.length}`);
  console.log("");
}

// Run the script
seedMarcelTestData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  });
