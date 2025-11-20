import { db } from "./db";
import { categories } from "@shared/schema";
import { eq } from "drizzle-orm";

const CATEGORIES = [
  { name: "Home Services", slug: "home-services", icon: "Home" },
  { name: "Design & Creative", slug: "design-creative", icon: "Palette" },
  { name: "Education & Tutoring", slug: "education", icon: "GraduationCap" },
  { name: "Wellness & Fitness", slug: "wellness", icon: "Dumbbell" },
  { name: "Business Support", slug: "business", icon: "Briefcase" },
];

export async function seedDatabase() {
  try {
    console.log("Seeding database...");

    // Seed categories if they don't exist
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

    console.log("Database seeding completed!");
  } catch (error) {
    console.error("Error seeding database:", error);
    // Don't throw - just log and continue
    console.log("Continuing despite seeding errors...");
  }
}
