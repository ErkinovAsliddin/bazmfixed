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
import { usersTable } from "./users";

export type DasturxonItem = {
  itemName: string;
  quantity: number;
  approxCost: number;
};

export const dasturxonEntriesTable = pgTable("dasturxon_entries", {
  id: serial("id").primaryKey(),
  // Nullable so entries can be shared anonymously.
  userId: integer("user_id").references(() => usersTable.id),
  city: text("city").notNull(),
  guestCount: integer("guest_count").notNull(),
  totalSpentOnFood: bigint("total_spent_on_food", { mode: "number" }).notNull(),
  itemsList: json("items_list").$type<DasturxonItem[]>().notNull().default([]),
  // Real photos of the table/spread. New entries require >= 2 (enforced in the
  // API). Older photoless entries are hidden from the public feed.
  photos: json("photos").$type<string[]>().notNull().default([]),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type DasturxonEntry = typeof dasturxonEntriesTable.$inferSelect;
export type InsertDasturxonEntry = typeof dasturxonEntriesTable.$inferInsert;
