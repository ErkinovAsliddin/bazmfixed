import {
  pgTable,
  serial,
  integer,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { marketplaceProductsTable } from "./marketplace";

/**
 * A logged-in user's shopping cart, persisted server-side so it follows them
 * across devices. Guests keep a client-only cart in localStorage; on login the
 * two are merged. One row per (user, product); quantity is the desired count.
 */
export const cartItemsTable = pgTable(
  "cart_items",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id),
    productId: integer("product_id")
      .notNull()
      .references(() => marketplaceProductsTable.id),
    quantity: integer("quantity").notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    userProductUnique: unique().on(t.userId, t.productId),
  }),
);

export type CartItem = typeof cartItemsTable.$inferSelect;
export type InsertCartItem = typeof cartItemsTable.$inferInsert;
