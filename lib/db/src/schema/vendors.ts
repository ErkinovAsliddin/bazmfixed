import {
  pgTable,
  serial,
  integer,
  bigint,
  text,
  boolean,
  timestamp,
  pgEnum,
  json,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const vendorCategoryEnum = pgEnum("vendor_category", [
  "venue",
  "catering",
  "decor",
  "music",
  "photography",
  "clothing",
  "rental_items",
  "wedding_products",
]);

export const unitTypeEnum = pgEnum("unit_type", [
  "per_guest",
  "per_event",
  "per_day",
  "flat",
]);

export const vendorsTable = pgTable("vendors", {
  id: serial("id").primaryKey(),
  ownerUserId: integer("owner_user_id").references(() => usersTable.id),
  businessName: text("business_name").notNull(),
  category: vendorCategoryEnum("category").notNull(),
  city: text("city").notNull(),
  address: text("address"),
  description: text("description"),
  phone: text("phone"),
  // The business's own photos, collected at onboarding (min 2 enforced in the
  // API). Distinct from per-tier photos on vendorTiersTable.
  photos: json("photos").$type<string[]>().notNull().default([]),
  isVerified: boolean("is_verified").notNull().default(false),
  // Admins can deactivate bad actors. Inactive vendors and their products are
  // hidden from buyers; the vendor keeps their account but cannot sell.
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vendorTiersTable = pgTable("vendor_tiers", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id")
    .notNull()
    .references(() => vendorsTable.id),
  // Free text so vendors can customize (e.g. "budget", "standard", "premium").
  tierName: text("tier_name").notNull(),
  // Money is stored in whole UZS. bigint gives the Postgres column effectively
  // unlimited headroom (no integer 2.1B ceiling), while mode:"number" keeps it a
  // plain JS number — safe because realistic UZS wedding amounts (hundreds of
  // millions at most) stay far below Number.MAX_SAFE_INTEGER (~9e15). Using
  // mode:"bigint" would break JSON serialization for no practical gain.
  pricePerUnit: bigint("price_per_unit", { mode: "number" }).notNull(),
  unitType: unitTypeEnum("unit_type").notNull(),
  description: text("description"),
  photos: json("photos").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vendorInquiriesTable = pgTable("vendor_inquiries", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id")
    .notNull()
    .references(() => vendorsTable.id),
  // Nullable: a guest can request contact details without an account.
  userId: integer("user_id").references(() => usersTable.id),
  message: text("message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Vendor = typeof vendorsTable.$inferSelect;
export type InsertVendor = typeof vendorsTable.$inferInsert;
export type VendorTier = typeof vendorTiersTable.$inferSelect;
export type InsertVendorTier = typeof vendorTiersTable.$inferInsert;
export type VendorInquiry = typeof vendorInquiriesTable.$inferSelect;
export type InsertVendorInquiry = typeof vendorInquiriesTable.$inferInsert;
