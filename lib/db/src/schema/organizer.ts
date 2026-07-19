import {
  pgTable,
  serial,
  integer,
  text,
  date,
  timestamp,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const organizerClientsTable = pgTable("organizer_clients", {
  id: serial("id").primaryKey(),
  organizerUserId: integer("organizer_user_id")
    .notNull()
    .references(() => usersTable.id),
  // Nullable: a client may not yet have a couple account in the system.
  coupleUserId: integer("couple_user_id").references(() => usersTable.id),
  clientName: text("client_name").notNull(),
  weddingDate: date("wedding_date"),
  notes: text("notes"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type OrganizerClient = typeof organizerClientsTable.$inferSelect;
export type InsertOrganizerClient = typeof organizerClientsTable.$inferInsert;
