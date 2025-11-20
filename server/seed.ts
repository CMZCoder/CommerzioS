import { db } from "./db";
import { categories, users, services, reviews } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

const CATEGORIES = [
  { name: "Home Services", slug: "home-services", icon: "Home" },
  { name: "Design & Creative", slug: "design-creative", icon: "Palette" },
  { name: "Education & Tutoring", slug: "education", icon: "GraduationCap" },
  { name: "Wellness & Fitness", slug: "wellness", icon: "Dumbbell" },
  { name: "Business Support", slug: "business", icon: "Briefcase" },
];

const SAMPLE_USERS = [
  {
    id: "demo-user-1",
    email: "maria.mueller@example.ch",
    firstName: "Maria",
    lastName: "Müller",
    profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
    isVerified: true,
    marketingPackage: "enterprise" as const,
  },
  {
    id: "demo-user-2",
    email: "hans.weber@example.ch",
    firstName: "Hans",
    lastName: "Weber",
    profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Hans",
    isVerified: true,
    marketingPackage: "basic" as const,
  },
  {
    id: "demo-user-3",
    email: "sophie.martin@example.ch",
    firstName: "Sophie",
    lastName: "Martin",
    profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie",
    isVerified: false,
    marketingPackage: "basic" as const,
  },
  {
    id: "demo-user-4",
    email: "thomas.schneider@example.ch",
    firstName: "Thomas",
    lastName: "Schneider",
    profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas",
    isVerified: true,
    marketingPackage: "pro" as const,
  },
];

export async function seedDatabase() {
  try {
    console.log("Seeding database...");

    // Seed categories
    for (const category of CATEGORIES) {
      const existing = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, category.slug));

      if (existing.length === 0) {
        await db.insert(categories).values(category);
        console.log(`Created category: ${category.name}`);
      } else {
        console.log(`Category already exists: ${category.name}`);
      }
    }

    // Get all categories for reference
    const allCategories = await db.select().from(categories);

    // Seed sample users
    for (const user of SAMPLE_USERS) {
      const existing = await db.select().from(users).where(eq(users.id, user.id));
      if (existing.length === 0) {
        await db.insert(users).values(user);
        console.log(`Created user: ${user.firstName} ${user.lastName}`);
      } else {
        console.log(`User already exists: ${user.firstName} ${user.lastName}`);
      }
    }

    // Seed sample services
    const homeCategory = allCategories.find((c) => c.slug === "home-services");
    const designCategory = allCategories.find((c) => c.slug === "design-creative");
    const educationCategory = allCategories.find((c) => c.slug === "education");
    const wellnessCategory = allCategories.find((c) => c.slug === "wellness");
    const businessCategory = allCategories.find((c) => c.slug === "business");

    if (!homeCategory || !designCategory || !educationCategory || !wellnessCategory || !businessCategory) {
      console.log("Skipping service seeding - not all categories found");
      return;
    }

    const SAMPLE_SERVICES = [
      {
        id: "demo-service-1",
        title: "Professional House Cleaning",
        description: "Thorough cleaning service for homes and apartments. Eco-friendly products, experienced team. Weekly or bi-weekly service available in Zurich area.",
        price: "45.00",
        priceUnit: "hour" as const,
        contactDetails: "maria.mueller@example.ch | +41 79 123 45 67",
        location: "Zürich",
        ownerId: "demo-user-1",
        categoryId: homeCategory.id,
        status: "active" as const,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        viewCount: 234,
      },
      {
        id: "demo-service-2",
        title: "Modern Logo Design",
        description: "Custom logo design for startups and small businesses. 3 concepts, unlimited revisions, vector files included. Portfolio available upon request.",
        price: "350.00",
        priceUnit: "job" as const,
        contactDetails: "hans.weber@example.ch | +41 76 987 65 43",
        location: "Bern",
        ownerId: "demo-user-2",
        categoryId: designCategory.id,
        status: "active" as const,
        expiresAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        viewCount: 187,
      },
      {
        id: "demo-service-3",
        title: "English Tutoring - All Levels",
        description: "Native English speaker offering one-on-one tutoring for all ages and levels. Specializing in business English and exam preparation (TOEFL, IELTS).",
        price: "55.00",
        priceUnit: "hour" as const,
        contactDetails: "sophie.martin@example.ch | +41 78 345 67 89",
        location: "Geneva",
        ownerId: "demo-user-3",
        categoryId: educationCategory.id,
        status: "active" as const,
        expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        viewCount: 156,
      },
      {
        id: "demo-service-4",
        title: "Personal Fitness Training",
        description: "Certified personal trainer with 10+ years experience. Customized workout plans, nutrition guidance. Home visits or gym sessions available in Basel.",
        price: "80.00",
        priceUnit: "hour" as const,
        contactDetails: "thomas.schneider@example.ch | +41 77 234 56 78",
        location: "Basel",
        ownerId: "demo-user-4",
        categoryId: wellnessCategory.id,
        status: "active" as const,
        expiresAt: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000),
        viewCount: 298,
      },
      {
        id: "demo-service-5",
        title: "Bookkeeping & Tax Preparation",
        description: "Professional bookkeeping services for small businesses and freelancers. Monthly financial reports, VAT filing, annual tax preparation. Fluent in German, French, and English.",
        price: "120.00",
        priceUnit: "consultation" as const,
        contactDetails: "maria.mueller@example.ch | +41 79 123 45 67",
        location: "Zürich",
        ownerId: "demo-user-1",
        categoryId: businessCategory.id,
        status: "active" as const,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        viewCount: 142,
      },
      {
        id: "demo-service-6",
        title: "Garden Maintenance Service",
        description: "Complete garden care including mowing, trimming, planting, and seasonal cleanup. Serving Lausanne and surrounding areas. Weekly or monthly plans available.",
        price: "60.00",
        priceUnit: "hour" as const,
        contactDetails: "thomas.schneider@example.ch | +41 77 234 56 78",
        location: "Lausanne",
        ownerId: "demo-user-4",
        categoryId: homeCategory.id,
        status: "active" as const,
        expiresAt: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
        viewCount: 89,
      },
    ];

    for (const service of SAMPLE_SERVICES) {
      const existing = await db.select().from(services).where(eq(services.id, service.id));
      if (existing.length === 0) {
        await db.insert(services).values(service);
        console.log(`Created service: ${service.title}`);
      } else {
        console.log(`Service already exists: ${service.title}`);
      }
    }

    // Seed sample reviews (only from verified users)
    const SAMPLE_REVIEWS = [
      {
        id: "demo-review-1",
        serviceId: "demo-service-1",
        userId: "demo-user-2",
        rating: 5,
        comment: "Maria's cleaning service is exceptional! Very thorough and professional. Highly recommend.",
      },
      {
        id: "demo-review-2",
        serviceId: "demo-service-1",
        userId: "demo-user-4",
        rating: 5,
        comment: "Outstanding service. Always on time and leaves the house spotless. Great value for money.",
      },
      {
        id: "demo-review-3",
        serviceId: "demo-service-2",
        userId: "demo-user-1",
        rating: 4,
        comment: "Good quality logo design. Hans was patient with revisions and delivered exactly what we needed.",
      },
      {
        id: "demo-review-4",
        serviceId: "demo-service-4",
        userId: "demo-user-1",
        rating: 5,
        comment: "Thomas is an amazing trainer! Lost 8kg in 3 months. Very knowledgeable and motivating.",
      },
      {
        id: "demo-review-5",
        serviceId: "demo-service-4",
        userId: "demo-user-2",
        rating: 5,
        comment: "Best fitness trainer in Basel! Personalized approach and great results.",
      },
    ];

    for (const review of SAMPLE_REVIEWS) {
      const existing = await db.select().from(reviews).where(eq(reviews.id, review.id));
      if (existing.length === 0) {
        await db.insert(reviews).values(review);
        console.log(`Created review for service: ${review.serviceId}`);
      } else {
        console.log(`Review already exists: ${review.id}`);
      }
    }

    console.log("Database seeding completed!");
  } catch (error) {
    console.error("Error seeding database:", error);
    // Don't throw - just log and continue
    console.log("Continuing despite seeding errors...");
  }
}
