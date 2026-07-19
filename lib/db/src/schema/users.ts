import { pgTable, serial, text, timestamp, pgEnum, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userRoleEnum = pgEnum("user_role", [
  "couple",
  "vendor",
  "organizer",
  "admin",
]);

export const localeEnum = pgEnum("locale", ["uz", "ru", "en"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email").notNull().unique(),
  // Nullable: accounts created via Google or phone-OTP have no password.
  passwordHash: text("password_hash"),
  // Google OAuth subject id, set when an account is linked to Google.
  googleId: text("google_id").unique(),
  role: userRoleEnum("role").notNull().default("couple"),
  preferredLocale: localeEnum("preferred_locale").notNull().default("uz"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// One-time codes for phone-number login/registration. The code is stored
// hashed; SMS delivery is stubbed (logged server-side) until a provider is set.
export const phoneOtpsTable = pgTable("phone_otps", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull(),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  consumedAt: timestamp("consumed_at"),
  // Failed verification attempts against this code; used to lock out brute force.
  attempts: integer("attempts").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PhoneOtp = typeof phoneOtpsTable.$inferSelect;

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
