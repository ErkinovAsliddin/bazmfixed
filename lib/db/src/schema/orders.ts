import {
  pgTable,
  serial,
  integer,
  bigint,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { marketplaceProductsTable } from "./marketplace";

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "fulfilled",
  "cancelled",
]);

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  buyerUserId: integer("buyer_user_id")
    .notNull()
    .references(() => usersTable.id),
  status: orderStatusEnum("status").notNull().default("pending"),
  totalAmount: bigint("total_amount", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orderItemsTable = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => ordersTable.id),
  productId: integer("product_id")
    .notNull()
    .references(() => marketplaceProductsTable.id),
  quantity: integer("quantity").notNull(),
  unitPriceAtPurchase: bigint("unit_price_at_purchase", {
    mode: "number",
  }).notNull(),
});

export type Order = typeof ordersTable.$inferSelect;
export type InsertOrder = typeof ordersTable.$inferInsert;
export type OrderItem = typeof orderItemsTable.$inferSelect;
export type InsertOrderItem = typeof orderItemsTable.$inferInsert;
