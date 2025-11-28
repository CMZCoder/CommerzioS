import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Platform settings table (non-sensitive settings only - API keys stored as env vars)
export const platformSettings = pgTable("platform_settings", {
  id: varchar("id").primaryKey().default('default'),
  requireEmailVerification: boolean("require_email_verification").default(false).notNull(),
  requirePhoneVerification: boolean("require_phone_verification").default(false).notNull(),
  enableSwissAddressValidation: boolean("enable_swiss_address_validation").default(true).notNull(),
  enableAiCategoryValidation: boolean("enable_ai_category_validation").default(true).notNull(),
  googleMapsApiKey: text("google_maps_api_key"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Plans table
export const plans = pgTable("plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  description: text("description"),
  priceMonthly: decimal("price_monthly", { precision: 10, scale: 2 }).notNull(),
  priceYearly: decimal("price_yearly", { precision: 10, scale: 2 }).notNull(),
  maxImages: integer("max_images").default(4).notNull(),
  listingDurationDays: integer("listing_duration_days").default(14).notNull(),
  canRenew: boolean("can_renew").default(true).notNull(),
  featuredListing: boolean("featured_listing").default(false).notNull(),
  prioritySupport: boolean("priority_support").default(false).notNull(),
  analyticsAccess: boolean("analytics_access").default(false).notNull(),
  customBranding: boolean("custom_branding").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const plansRelations = relations(plans, ({ many }) => ({
  users: many(users),
}));

// Users table (extended for marketplace with local auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phone: varchar("phone", { length: 50 }),
  phoneNumber: varchar("phone_number", { length: 50 }),
  
  // Authentication fields
  passwordHash: varchar("password_hash", { length: 255 }),
  authProvider: varchar("auth_provider", { enum: ["local", "google", "twitter", "facebook"] }).default("local").notNull(),
  oauthProviderId: varchar("oauth_provider_id", { length: 255 }),
  
  // Email verification
  emailVerificationToken: varchar("email_verification_token", { length: 255 }),
  emailVerificationExpires: timestamp("email_verification_expires"),
  
  // Password reset
  passwordResetToken: varchar("password_reset_token", { length: 255 }),
  passwordResetExpires: timestamp("password_reset_expires"),
  
  // Login security
  lastLoginAt: timestamp("last_login_at"),
  failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
  lockedUntil: timestamp("locked_until"),
  
  // Existing verification flags
  isVerified: boolean("is_verified").default(false).notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  phoneVerified: boolean("phone_verified").default(false).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  status: varchar("status", { enum: ["active", "warned", "suspended", "banned", "kicked"] }).default("active").notNull(),
  statusReason: text("status_reason"),
  planId: varchar("plan_id").references(() => plans.id),
  marketingPackage: varchar("marketing_package", { enum: ["basic", "pro", "premium", "enterprise"] }).default("basic"),
  locationLat: decimal("location_lat", { precision: 10, scale: 7 }),
  locationLng: decimal("location_lng", { precision: 10, scale: 7 }),
  preferredLocationName: varchar("preferred_location_name", { length: 200 }),
  preferredSearchRadiusKm: integer("preferred_search_radius_km").default(10),
  lastHomeVisitAt: timestamp("last_home_visit_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_users_email").on(table.email),
  index("idx_users_auth_provider").on(table.authProvider),
]);

export const usersRelations = relations(users, ({ one, many }) => ({
  plan: one(plans, {
    fields: [users.planId],
    references: [plans.id],
  }),
  services: many(services),
  reviews: many(reviews),
  favorites: many(favorites),
  submittedCategories: many(submittedCategories),
  aiConversations: many(aiConversations),
  addresses: many(addresses),
  moderationActions: many(userModerationActions),
  oauthTokens: many(oauthTokens),
}));

// OAuth tokens table (for storing social login tokens)
export const oauthTokens = pgTable("oauth_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: varchar("provider", { enum: ["google", "twitter", "facebook"] }).notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_oauth_tokens_user").on(table.userId),
  index("idx_oauth_tokens_provider").on(table.provider),
]);

export const oauthTokensRelations = relations(oauthTokens, ({ one }) => ({
  user: one(users, {
    fields: [oauthTokens.userId],
    references: [users.id],
  }),
}));

// Addresses table
export const addresses = pgTable("addresses", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 100 }),
  street: varchar("street", { length: 255 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  postalCode: varchar("postal_code", { length: 20 }).notNull(),
  canton: varchar("canton", { length: 100 }),
  country: varchar("country", { length: 100 }).notNull().default("Switzerland"),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_addresses_user").on(table.userId),
]);

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, {
    fields: [addresses.userId],
    references: [users.id],
  }),
}));

// User moderation actions table (audit log)
export const userModerationActions = pgTable("user_moderation_actions", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  adminId: varchar("admin_id").references(() => users.id),
  action: varchar("action", { enum: ["warn", "suspend", "ban", "kick", "reactivate"] }).notNull(),
  previousStatus: varchar("previous_status", { enum: ["active", "warned", "suspended", "banned", "kicked"] }),
  newStatus: varchar("new_status", { enum: ["active", "warned", "suspended", "banned", "kicked"] }).notNull(),
  reason: text("reason"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_moderation_user").on(table.userId),
  index("idx_moderation_admin").on(table.adminId),
  index("idx_moderation_action").on(table.action),
]);

export const userModerationActionsRelations = relations(userModerationActions, ({ one }) => ({
  user: one(users, {
    fields: [userModerationActions.userId],
    references: [users.id],
  }),
  admin: one(users, {
    fields: [userModerationActions.adminId],
    references: [users.id],
  }),
}));

// Banned identifiers table (IP, email, phone tracking)
export const bannedIdentifiers = pgTable("banned_identifiers", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  identifierType: varchar("identifier_type", { enum: ["ip", "email", "phone"] }).notNull(),
  identifierValue: varchar("identifier_value", { length: 255 }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  bannedBy: varchar("banned_by").references(() => users.id),
  reason: text("reason"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
}, (table) => [
  index("idx_banned_type_value").on(table.identifierType, table.identifierValue),
  index("idx_banned_user").on(table.userId),
]);

export const bannedIdentifiersRelations = relations(bannedIdentifiers, ({ one }) => ({
  user: one(users, {
    fields: [bannedIdentifiers.userId],
    references: [users.id],
  }),
  bannedByUser: one(users, {
    fields: [bannedIdentifiers.bannedBy],
    references: [users.id],
  }),
}));

// Categories table
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  icon: varchar("icon", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  services: many(services),
  subcategories: many(subcategories),
}));

// Subcategories table
export const subcategories = pgTable("subcategories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_subcategories_category").on(table.categoryId),
]);

export const subcategoriesRelations = relations(subcategories, ({ one, many }) => ({
  category: one(categories, {
    fields: [subcategories.categoryId],
    references: [categories.id],
  }),
  services: many(services),
}));

// Temporary categories (AI-suggested, auto-expire after 24 hours)
export const temporaryCategories = pgTable("temporary_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  icon: varchar("icon", { length: 50 }),
  aiSuggested: boolean("ai_suggested").default(true).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const temporaryCategoriesRelations = relations(temporaryCategories, ({ one }) => ({
  user: one(users, {
    fields: [temporaryCategories.userId],
    references: [users.id],
  }),
}));

// User-submitted categories (pending approval)
export const submittedCategories = pgTable("submitted_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status", { enum: ["pending", "approved", "rejected"] }).default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const submittedCategoriesRelations = relations(submittedCategories, ({ one }) => ({
  user: one(users, {
    fields: [submittedCategories.userId],
    references: [users.id],
  }),
}));

// Price list item type
export const priceListSchema = z.object({
  description: z.string(),
  price: z.string(),
  unit: z.string().optional(),
});

// Image metadata type
const cropAreaSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

export const imageMetadataSchema = z.object({
  crop: cropAreaSchema.optional(), // Percentages (0-100)
  cropPixels: cropAreaSchema.optional(), // Pixel coordinates
  rotation: z.number().default(0),
  zoom: z.number().default(1).optional(),
});

// Services table
export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  categoryId: varchar("category_id").notNull().references(() => categories.id),
  subcategoryId: varchar("subcategory_id").references(() => subcategories.id),
  priceType: varchar("price_type", { enum: ["fixed", "list", "text"] }).default("fixed").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }),
  priceText: text("price_text"),
  priceList: jsonb("price_list").default(sql`'[]'::jsonb`),
  priceUnit: varchar("price_unit", { enum: ["hour", "job", "consultation", "day", "month"] }).notNull(),
  locations: text("locations").array().default(sql`ARRAY[]::text[]`).notNull(),
  locationLat: decimal("location_lat", { precision: 10, scale: 7 }),
  locationLng: decimal("location_lng", { precision: 10, scale: 7 }),
  preferredLocationName: varchar("preferred_location_name", { length: 200 }),
  images: text("images").array().default(sql`ARRAY[]::text[]`).notNull(),
  imageMetadata: jsonb("image_metadata").default(sql`'[]'::jsonb`),
  mainImageIndex: integer("main_image_index").default(0).notNull(),
  status: varchar("status", { enum: ["draft", "active", "paused", "expired"] }).default("draft").notNull(),
  tags: text("tags").array().default(sql`ARRAY[]::text[]`).notNull(),
  hashtags: text("hashtags").array().default(sql`ARRAY[]::text[]`).notNull(),
  contactPhone: varchar("contact_phone", { length: 50 }).notNull(),
  contactEmail: varchar("contact_email", { length: 200 }).notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_services_owner").on(table.ownerId),
  index("idx_services_category").on(table.categoryId),
  index("idx_services_status").on(table.status),
]);

export const servicesRelations = relations(services, ({ one, many }) => ({
  owner: one(users, {
    fields: [services.ownerId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [services.categoryId],
    references: [categories.id],
  }),
  subcategory: one(subcategories, {
    fields: [services.subcategoryId],
    references: [subcategories.id],
  }),
  reviews: many(reviews),
  favorites: many(favorites),
  serviceContacts: many(serviceContacts),
}));

// Service contacts table (support multiple phone/email with verification)
export const serviceContacts = pgTable("service_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  contactType: varchar("contact_type", { enum: ["phone", "email"] }).notNull(),
  value: varchar("value", { length: 200 }).notNull(),
  name: varchar("name", { length: 100 }),
  role: varchar("role", { length: 100 }),
  isPrimary: boolean("is_primary").default(false).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  verificationCode: varchar("verification_code", { length: 10 }),
  verificationExpiresAt: timestamp("verification_expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_service_contacts_service").on(table.serviceId),
]);

export const serviceContactsRelations = relations(serviceContacts, ({ one }) => ({
  service: one(services, {
    fields: [serviceContacts.serviceId],
    references: [services.id],
  }),
}));

// AI conversations table (track AI interactions)
export const aiConversations = pgTable("ai_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  conversationType: varchar("conversation_type", { enum: ["admin_assist", "user_support", "category_validation"] }).notNull(),
  messages: jsonb("messages").default(sql`'[]'::jsonb`).notNull(),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`).notNull(),
  status: varchar("status", { enum: ["active", "completed", "archived"] }).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ai_conversations_user").on(table.userId),
  index("idx_ai_conversations_type").on(table.conversationType),
]);

export const aiConversationsRelations = relations(aiConversations, ({ one }) => ({
  user: one(users, {
    fields: [aiConversations.userId],
    references: [users.id],
  }),
}));

// Reviews table
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  editCount: integer("edit_count").default(0).notNull(),
  lastEditedAt: timestamp("last_edited_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_reviews_service").on(table.serviceId),
  index("idx_reviews_user").on(table.userId),
]);

export const reviewsRelations = relations(reviews, ({ one }) => ({
  service: one(services, {
    fields: [reviews.serviceId],
    references: [services.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
}));

// Favorites table (bonus feature)
export const favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_favorites_user").on(table.userId),
  index("idx_favorites_service").on(table.serviceId),
]);

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  service: one(services, {
    fields: [favorites.serviceId],
    references: [services.id],
  }),
}));

// Types
export type Plan = typeof plans.$inferSelect;
export type InsertPlan = typeof plans.$inferInsert;

export type PlatformSettings = typeof platformSettings.$inferSelect;
export type InsertPlatformSettings = typeof platformSettings.$inferInsert;

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type UserWithPlan = User & { plan?: Plan };

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

export type Subcategory = typeof subcategories.$inferSelect;
export type InsertSubcategory = typeof subcategories.$inferInsert;

export type TemporaryCategory = typeof temporaryCategories.$inferSelect;
export type InsertTemporaryCategory = typeof temporaryCategories.$inferInsert;

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

export type ServiceContact = typeof serviceContacts.$inferSelect;
export type InsertServiceContact = typeof serviceContacts.$inferInsert;

export type AiConversation = typeof aiConversations.$inferSelect;
export type InsertAiConversation = typeof aiConversations.$inferInsert;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

export type SubmittedCategory = typeof submittedCategories.$inferSelect;
export type InsertSubmittedCategory = typeof submittedCategories.$inferInsert;

export type SelectAddress = typeof addresses.$inferSelect;

export type UserModerationAction = typeof userModerationActions.$inferSelect;
export type InsertUserModerationAction = typeof userModerationActions.$inferInsert;

export type BannedIdentifier = typeof bannedIdentifiers.$inferSelect;
export type InsertBannedIdentifier = typeof bannedIdentifiers.$inferInsert;

// Zod schemas for validation
export const insertServiceSchema = createInsertSchema(services, {
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  description: z.string().min(20, "Description must be at least 20 characters"),
  contactPhone: z.string().min(10, "Valid phone number required"),
  contactEmail: z.string().email("Valid email required"),
  locations: z.array(z.string()).min(1, "At least one location required"),
  priceType: z.enum(["fixed", "list", "text"]),
  price: z.string().optional(),
  priceText: z.string().optional(),
  priceList: z.any().optional(),
  hashtags: z.array(z.string().min(1, "Hashtag must have at least 1 character")).max(3, "Maximum 3 hashtags allowed").optional(),
  subcategoryId: z.string().optional().nullable(),
}).omit({
  id: true,
  ownerId: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
  status: true,
}).superRefine((val, ctx) => {
  if (val.priceType === "fixed" && (!val.price || isNaN(Number(val.price)))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["price"],
      message: "Price is required for fixed pricing",
    });
  }
  if (val.priceType === "text" && !val.priceText) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["priceText"],
      message: "Price text is required",
    });
  }
});

export const insertReviewSchema = createInsertSchema(reviews, {
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, "Review must be at least 10 characters"),
}).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertSubmittedCategorySchema = createInsertSchema(submittedCategories, {
  name: z.string().min(3, "Category name must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(500),
}).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertPlanSchema = createInsertSchema(plans, {
  name: z.string().min(3, "Plan name must be at least 3 characters").max(100),
  slug: z.string().min(3, "Slug must be at least 3 characters").max(100),
  maxImages: z.number().min(1).max(100),
  listingDurationDays: z.number().min(1).max(365),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceContactSchema = createInsertSchema(serviceContacts, {
  value: z.string().min(1, "Contact value is required"),
  contactType: z.enum(["phone", "email"]),
  name: z.string().optional(),
  role: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
  isVerified: true,
  verificationCode: true,
  verificationExpiresAt: true,
});

export const insertTemporaryCategorySchema = createInsertSchema(temporaryCategories, {
  name: z.string().min(3, "Category name must be at least 3 characters").max(100),
  slug: z.string().min(3, "Slug must be at least 3 characters").max(100),
}).omit({
  id: true,
  createdAt: true,
});

export const insertAiConversationSchema = createInsertSchema(aiConversations, {
  conversationType: z.enum(["admin_assist", "user_support", "category_validation"]),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAddressSchema = createInsertSchema(addresses, {
  street: z.string().min(1, "Street is required").max(255),
  city: z.string().min(1, "City is required").max(100),
  postalCode: z.string().min(1, "Postal code is required").max(20),
  canton: z.string().optional(),
  label: z.string().optional(),
}).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAddress = z.infer<typeof insertAddressSchema>;

export const insertUserModerationActionSchema = createInsertSchema(userModerationActions, {
  action: z.enum(["warn", "suspend", "ban", "kick", "reactivate"]),
  reason: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertBannedIdentifierSchema = createInsertSchema(bannedIdentifiers, {
  identifierType: z.enum(["ip", "email", "phone"]),
  identifierValue: z.string().min(1, "Identifier value is required"),
  reason: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
});

// OAuth tokens types
export type OAuthToken = typeof oauthTokens.$inferSelect;
export type InsertOAuthToken = typeof oauthTokens.$inferInsert;

// Auth validation schemas
export const registerSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
});

export const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Valid email is required"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});
