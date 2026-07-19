/**
 * Seeds the Bazm database with realistic sample data for development.
 *
 * Idempotent: it clears the domain tables (vendors, tiers, dasturxon entries,
 * marketplace products) before inserting so it can be re-run safely.
 *
 * Run with: pnpm --filter @workspace/scripts run seed
 */
import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import { inArray } from "drizzle-orm";
import {
  db,
  pool,
  vendorsTable,
  vendorTiersTable,
  dasturxonEntriesTable,
  marketplaceProductsTable,
  usersTable,
  budgetPlansTable,
  budgetPlanItemsTable,
  organizerClientsTable,
  type InsertDasturxonEntry,
} from "@workspace/db";
import { DEMO_VENDORS, DEMO_MARKETPLACE_PRODUCTS } from "./demoVendorCatalog";

const dasturxonEntries: Array<Omit<InsertDasturxonEntry, "id" | "createdAt">> = [
  {
    city: "Tashkent",
    guestCount: 300,
    totalSpentOnFood: 42_000_000,
    isPublic: true,
    itemsList: [
      { itemName: "Plov", quantity: 300, approxCost: 21_000_000 },
      { itemName: "Salads", quantity: 300, approxCost: 6_000_000 },
      { itemName: "Grilled meats (shashlik)", quantity: 300, approxCost: 9_000_000 },
      { itemName: "Sweets & pastries", quantity: 300, approxCost: 3_000_000 },
      { itemName: "Fruit", quantity: 300, approxCost: 2_000_000 },
      { itemName: "Drinks", quantity: 300, approxCost: 1_000_000 },
    ],
  },
  {
    city: "Samarkand",
    guestCount: 450,
    totalSpentOnFood: 68_000_000,
    isPublic: true,
    itemsList: [
      { itemName: "Plov", quantity: 450, approxCost: 31_000_000 },
      { itemName: "Salads", quantity: 450, approxCost: 9_000_000 },
      { itemName: "Kebabs", quantity: 450, approxCost: 15_000_000 },
      { itemName: "Sweets", quantity: 450, approxCost: 6_000_000 },
      { itemName: "Fruit", quantity: 450, approxCost: 4_000_000 },
      { itemName: "Drinks", quantity: 450, approxCost: 3_000_000 },
    ],
  },
  {
    city: "Bukhara",
    guestCount: 200,
    totalSpentOnFood: 24_000_000,
    isPublic: true,
    itemsList: [
      { itemName: "Plov", quantity: 200, approxCost: 12_000_000 },
      { itemName: "Dasturxon spread", quantity: 200, approxCost: 7_000_000 },
      { itemName: "Sweets & dried fruit", quantity: 200, approxCost: 3_000_000 },
      { itemName: "Fruit", quantity: 200, approxCost: 1_500_000 },
      { itemName: "Tea & drinks", quantity: 200, approxCost: 500_000 },
    ],
  },
  {
    city: "Tashkent",
    guestCount: 600,
    totalSpentOnFood: 108_000_000,
    isPublic: true,
    itemsList: [
      { itemName: "Plov", quantity: 600, approxCost: 48_000_000 },
      { itemName: "Cold appetizers", quantity: 600, approxCost: 18_000_000 },
      { itemName: "Grilled meats", quantity: 600, approxCost: 24_000_000 },
      { itemName: "Dessert bar", quantity: 600, approxCost: 10_000_000 },
      { itemName: "Fruit", quantity: 600, approxCost: 5_000_000 },
      { itemName: "Drinks", quantity: 600, approxCost: 3_000_000 },
    ],
  },
  {
    city: "Samarkand",
    guestCount: 150,
    totalSpentOnFood: 16_500_000,
    isPublic: true,
    itemsList: [
      { itemName: "Plov", quantity: 150, approxCost: 9_000_000 },
      { itemName: "Salads", quantity: 150, approxCost: 3_000_000 },
      { itemName: "Sweets", quantity: 150, approxCost: 2_500_000 },
      { itemName: "Fruit", quantity: 150, approxCost: 1_500_000 },
      { itemName: "Tea & drinks", quantity: 150, approxCost: 500_000 },
    ],
  },
];

/** Shared demo password for every seeded account (dev only). */
const SEED_PASSWORD = "organizer123";

const ORGANIZER = {
  name: "Dilnoza Karimova",
  email: "organizer@bazm.uz",
};

const ADMIN_PASSWORD = "admin123";

const ADMIN = {
  name: "Bazm Admin",
  email: "admin@bazm.uz",
};

type CoupleSeed = {
  name: string;
  email: string;
  city: string;
  guestCount: number;
  totalBudget: number;
  /** Categories the couple has already locked in a vendor tier for. */
  decided: string[];
  weddingInDays: number;
  status: string;
  notes: string;
};

const COUPLES: CoupleSeed[] = [
  {
    name: "Jasur & Nigora",
    email: "jasur.nigora@demo.bazm.uz",
    city: "Tashkent",
    guestCount: 300,
    totalBudget: 220_000_000,
    decided: ["venue", "catering", "photography"],
    weddingInDays: 20,
    status: "confirmed",
    notes: "Venue booked at Chorsu Palace. Still choosing decor and music.",
  },
  {
    name: "Sardor & Zarina",
    email: "sardor.zarina@demo.bazm.uz",
    city: "Samarkand",
    guestCount: 450,
    totalBudget: 340_000_000,
    decided: ["venue", "catering", "decor", "music", "photography"],
    weddingInDays: 60,
    status: "planning",
    notes: "Large wedding. Only the outfits are left to finalize.",
  },
  {
    name: "Bekzod & Kamila",
    email: "bekzod.kamila@demo.bazm.uz",
    city: "Bukhara",
    guestCount: 200,
    totalBudget: 150_000_000,
    decided: ["venue"],
    weddingInDays: 12,
    status: "active",
    notes: "Wedding is close but most categories are still undecided.",
  },
];

/** Manually-tracked clients not yet on Bazm (no linked account or plan). */
const MANUAL_CLIENTS = [
  {
    clientName: "Otabek & Sevara",
    weddingInDays: 10,
    status: "confirmed",
    notes: "Couple prefers a small Tashkent venue. Not on Bazm yet.",
  },
  {
    clientName: "Rustam & Feruza",
    weddingInDays: 45,
    status: "planning",
    notes: "Early planning. Will register on Bazm next month.",
  },
  {
    clientName: "Timur & Dilfuza",
    weddingInDays: null,
    status: "active",
    notes: "Date not set yet — waiting on family.",
  },
];

const SEED_USER_EMAILS = [
  ORGANIZER.email,
  ADMIN.email,
  ...COUPLES.map((c) => c.email),
];

/** Hash a password in the same `salt:hash` scrypt scheme the API uses. */
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

/** ISO "YYYY-MM-DD" a number of days from today, or null. */
function isoDaysFromNow(days: number | null): string | null {
  if (days === null) return null;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function seed(): Promise<void> {
  console.log("Clearing existing domain seed data...");
  // Delete in dependency order. Plans/items reference vendor tiers, so they
  // must go before the tiers are cleared. Organizer clients reference users.
  await db.delete(organizerClientsTable);
  await db.delete(budgetPlanItemsTable);
  await db.delete(budgetPlansTable);
  await db.delete(marketplaceProductsTable);
  await db.delete(vendorTiersTable);
  await db.delete(dasturxonEntriesTable);
  await db.delete(vendorsTable);
  // Only remove the seeded demo accounts, never real registered users.
  await db.delete(usersTable).where(inArray(usersTable.email, SEED_USER_EMAILS));

  // DEMO vendors, tiers, and marketplace products (see demoVendorCatalog.ts).
  // These are fictional businesses with placeholder photos, used to populate
  // the marketplace/vendor directory for demos and development. They are not
  // real vendors — swap them out as real vendors apply and get approved by
  // an admin.
  console.log(`Inserting ${DEMO_VENDORS.length} demo vendors and their tiers...`);
  const vendorIdBySlug = new Map<string, number>();
  for (const demoVendor of DEMO_VENDORS) {
    const { slug, tiers, ...vendorFields } = demoVendor;
    const [insertedVendor] = await db
      .insert(vendorsTable)
      .values(vendorFields)
      .returning();
    vendorIdBySlug.set(slug, insertedVendor.id);

    if (tiers.length > 0) {
      await db.insert(vendorTiersTable).values(
        tiers.map((tier) => ({
          ...tier,
          vendorId: insertedVendor.id,
        })),
      );
    }
  }

  console.log(
    `Inserting ${DEMO_MARKETPLACE_PRODUCTS.length} demo marketplace products...`,
  );
  for (const product of DEMO_MARKETPLACE_PRODUCTS) {
    const { vendorSlug, ...productFields } = product;
    const sellerVendorId = vendorIdBySlug.get(vendorSlug);
    if (!sellerVendorId) {
      throw new Error(
        `Demo product "${product.name}" references unknown vendor slug "${vendorSlug}"`,
      );
    }
    await db.insert(marketplaceProductsTable).values({
      ...productFields,
      sellerVendorId,
    });
  }

  console.log(
    `Inserting ${dasturxonEntries.length} dasturxon entries (photoless ones stay hidden from the public feed)...`,
  );
  await db.insert(dasturxonEntriesTable).values(dasturxonEntries);

  console.log("Inserting organizer, couples, and budget plans...");
  const passwordHash = hashPassword(SEED_PASSWORD);

  const [organizer] = await db
    .insert(usersTable)
    .values({
      name: ORGANIZER.name,
      email: ORGANIZER.email,
      passwordHash,
      role: "organizer",
    })
    .returning();

  // Admin accounts are never self-assignable at registration, so seed one here.
  await db.insert(usersTable).values({
    name: ADMIN.name,
    email: ADMIN.email,
    passwordHash: hashPassword(ADMIN_PASSWORD),
    role: "admin",
  });

  for (const couple of COUPLES) {
    const [coupleUser] = await db
      .insert(usersTable)
      .values({
        name: couple.name,
        email: couple.email,
        passwordHash,
        role: "couple",
      })
      .returning();

    const [plan] = await db
      .insert(budgetPlansTable)
      .values({
        userId: coupleUser.id,
        title: `${couple.name} — ${couple.city}`,
        city: couple.city,
        guestCount: couple.guestCount,
        totalBudget: couple.totalBudget,
        priorities: null,
        shareToken: randomUUID(),
      })
      .returning();

    // Budget plans start empty — couples build them by picking real, approved
    // vendors in the planner once vendors have onboarded.

    await db.insert(organizerClientsTable).values({
      organizerUserId: organizer.id,
      coupleUserId: coupleUser.id,
      clientName: couple.name,
      weddingDate: isoDaysFromNow(couple.weddingInDays),
      notes: couple.notes,
      status: couple.status,
    });
  }

  for (const client of MANUAL_CLIENTS) {
    await db.insert(organizerClientsTable).values({
      organizerUserId: organizer.id,
      coupleUserId: null,
      clientName: client.clientName,
      weddingDate: isoDaysFromNow(client.weddingInDays),
      notes: client.notes,
      status: client.status,
    });
  }

  console.log(
    `Seed complete. Organizer login: ${ORGANIZER.email} / ${SEED_PASSWORD}`,
  );
  console.log(`Admin login: ${ADMIN.email} / ${ADMIN_PASSWORD}`);
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
