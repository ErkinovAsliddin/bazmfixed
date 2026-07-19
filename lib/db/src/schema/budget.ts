import {
  pgTable,
  serial,
  integer,
  bigint,
  text,
  timestamp,
  json,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { vendorCategoryEnum, vendorTiersTable } from "./vendors";

export const budgetPlansTable = pgTable("budget_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  // Optional label the couple gives the plan, e.g. "Our September wedding".
  title: text("title"),
  city: text("city").notNull(),
  guestCount: integer("guest_count").notNull(),
  // Nullable: the user may ask the planner to figure out a budget for them.
  totalBudget: bigint("total_budget", { mode: "number" }),
  // Category weights the user set, e.g. { catering: 0.4, venue: 0.3, ... }
  priorities: json("priorities").$type<Record<string, number>>(),
  // Unguessable token for the public read-only "share with family" view. Serial
  // ids are guessable, so sharing is gated on this random token instead.
  shareToken: text("share_token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const budgetPlanItemsTable = pgTable("budget_plan_items", {
  id: serial("id").primaryKey(),
  budgetPlanId: integer("budget_plan_id")
    .notNull()
    .references(() => budgetPlansTable.id),
  category: vendorCategoryEnum("category").notNull(),
  estimatedCost: bigint("estimated_cost", { mode: "number" }).notNull(),
  chosenVendorTierId: integer("chosen_vendor_tier_id").references(
    () => vendorTiersTable.id,
  ),
});

export type BudgetPlan = typeof budgetPlansTable.$inferSelect;
export type InsertBudgetPlan = typeof budgetPlansTable.$inferInsert;
export type BudgetPlanItem = typeof budgetPlanItemsTable.$inferSelect;
export type InsertBudgetPlanItem = typeof budgetPlanItemsTable.$inferInsert;
