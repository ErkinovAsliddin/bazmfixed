import {
  pgTable,
  serial,
  integer,
  bigint,
  text,
  boolean,
  timestamp,
  json,
} from "drizzle-orm/pg-core";
import { vendorsTable } from "./vendors";

export const marketplaceProductsTable = pgTable("marketplace_products", {
  id: serial("id").primaryKey(),
  sellerVendorId: integer("seller_vendor_id")
    .notNull()
    .references(() => vendorsTable.id),
  name: text("name").notNull(),
  category: text("category").notNull(),
  pricePerUnit: bigint("price_per_unit", { mode: "number" }).notNull(),
  unit: text("unit").notNull(),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  photos: json("photos").$type<string[]>().notNull().default([]),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type MarketplaceProduct = typeof marketplaceProductsTable.$inferSelect;
export type InsertMarketplaceProduct =
  typeof marketplaceProductsTable.$inferInsert;
