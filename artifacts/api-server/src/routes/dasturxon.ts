import { Router, type IRouter } from "express";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import {
  db,
  dasturxonEntriesTable,
  budgetPlansTable,
  budgetPlanItemsTable,
  vendorTiersTable,
  type DasturxonEntry,
  type DasturxonItem,
} from "@workspace/db";
import {
  ListDasturxonResponse,
  CreateDasturxonBody,
  CreateDasturxonResponse,
  ListMyDasturxonResponse,
  GetDasturxonStatsResponse,
  GetDasturxonComparisonResponse,
} from "@workspace/api-zod";
import { getSessionUserId } from "../lib/auth";

const router: IRouter = Router();

// Public entries hide who submitted them — the whole point is anonymized
// "a wedding in Tashkent, 150 guests" social proof.
function toSummary(entry: DasturxonEntry) {
  return {
    id: entry.id,
    city: entry.city,
    guestCount: entry.guestCount,
    totalSpentOnFood: entry.totalSpentOnFood,
    perGuestSpend: perGuest(entry.totalSpentOnFood, entry.guestCount),
    items: entry.itemsList,
    photos: entry.photos,
    createdAt: entry.createdAt.toISOString(),
  };
}

/** Whole-UZS spend divided across guests, guarding against a zero guest count. */
function perGuest(total: number, guests: number): number {
  return guests > 0 ? Math.round(total / guests) : 0;
}

function round(value: number): number {
  return Math.round(value);
}

/**
 * Parse a guest-count query param, or null when absent/invalid. Mirrors the
 * OpenAPI bounds (integer, 1..5000); anything outside is ignored rather than
 * silently clamped, so a bad filter never widens the result set.
 */
function intParam(value: unknown): number | null {
  if (typeof value !== "string" || value.length === 0) return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 5000 ? n : null;
}

// ---------------------------------------------------------------------------
// Public feed
// ---------------------------------------------------------------------------

// GET /dasturxon — public feed, filterable by city and guest-count range.
router.get("/dasturxon", async (req, res): Promise<void> => {
  const filters = [
    eq(dasturxonEntriesTable.isPublic, true),
    // Hide legacy photoless entries — the public feed is now photo-first.
    sql`json_array_length(${dasturxonEntriesTable.photos}) >= 1`,
  ];

  const { city } = req.query;
  if (typeof city === "string" && city.length > 0) {
    filters.push(eq(dasturxonEntriesTable.city, city));
  }
  const minGuests = intParam(req.query.minGuests);
  const maxGuests = intParam(req.query.maxGuests);
  if (minGuests !== null) {
    filters.push(gte(dasturxonEntriesTable.guestCount, minGuests));
  }
  if (maxGuests !== null) {
    filters.push(lte(dasturxonEntriesTable.guestCount, maxGuests));
  }

  const entries = await db
    .select()
    .from(dasturxonEntriesTable)
    .where(and(...filters))
    .orderBy(desc(dasturxonEntriesTable.createdAt));

  res.json(ListDasturxonResponse.parse(entries.map(toSummary)));
});

// GET /dasturxon/stats — average food spend per guest, optionally by city.
router.get("/dasturxon/stats", async (req, res): Promise<void> => {
  const cityFilter =
    typeof req.query.city === "string" && req.query.city.length > 0
      ? req.query.city
      : null;

  const filters = [eq(dasturxonEntriesTable.isPublic, true)];
  if (cityFilter) filters.push(eq(dasturxonEntriesTable.city, cityFilter));

  const entries = await db
    .select()
    .from(dasturxonEntriesTable)
    .where(and(...filters));

  const entryCount = entries.length;
  const avg = (nums: number[]) =>
    nums.length ? round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0;

  res.json(
    GetDasturxonStatsResponse.parse({
      city: cityFilter,
      entryCount,
      avgSpendPerGuest: avg(
        entries.map((e) => perGuest(e.totalSpentOnFood, e.guestCount)),
      ),
      avgTotalSpend: avg(entries.map((e) => e.totalSpentOnFood)),
      avgGuestCount: avg(entries.map((e) => e.guestCount)),
    }),
  );
});

// GET /dasturxon/mine — the signed-in user's own entries (public + private).
router.get("/dasturxon/mine", async (req, res): Promise<void> => {
  const userId = getSessionUserId(req);
  if (userId === null) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  const entries = await db
    .select()
    .from(dasturxonEntriesTable)
    .where(eq(dasturxonEntriesTable.userId, userId))
    .orderBy(desc(dasturxonEntriesTable.createdAt));

  res.json(
    ListMyDasturxonResponse.parse(
      entries.map((e) => ({ ...toSummary(e), isPublic: e.isPublic })),
    ),
  );
});

// GET /dasturxon/comparison — your planned dasturxon vs. similar real weddings.
router.get("/dasturxon/comparison", async (req, res): Promise<void> => {
  const userId = getSessionUserId(req);
  if (userId === null) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  // The user's most recent plan is treated as their "active" plan.
  const [plan] = await db
    .select()
    .from(budgetPlansTable)
    .where(eq(budgetPlansTable.userId, userId))
    .orderBy(desc(budgetPlansTable.createdAt))
    .limit(1);

  if (!plan) {
    res.json(
      GetDasturxonComparisonResponse.parse({
        hasPlan: false,
        plan: null,
        similar: null,
      }),
    );
    return;
  }

  // Planned food spend comes from the plan's catering line, plus the chosen
  // tier's description as the "menu" the couple is currently planning.
  const [cateringItem] = await db
    .select()
    .from(budgetPlanItemsTable)
    .where(
      and(
        eq(budgetPlanItemsTable.budgetPlanId, plan.id),
        eq(budgetPlanItemsTable.category, "catering"),
      ),
    );

  let plannedMenu: string | null = null;
  if (cateringItem?.chosenVendorTierId != null) {
    const [tier] = await db
      .select()
      .from(vendorTiersTable)
      .where(eq(vendorTiersTable.id, cateringItem.chosenVendorTierId));
    plannedMenu = tier?.description ?? null;
  }

  const plannedFoodSpend = cateringItem?.estimatedCost ?? null;
  const plannedPerGuest =
    plannedFoodSpend !== null
      ? perGuest(plannedFoodSpend, plan.guestCount)
      : null;

  // Weddings within +/-20% of the couple's guest count are "similar".
  const guestMin = Math.floor(plan.guestCount * 0.8);
  const guestMax = Math.ceil(plan.guestCount * 1.2);

  const similarEntries = await db
    .select()
    .from(dasturxonEntriesTable)
    .where(
      and(
        eq(dasturxonEntriesTable.isPublic, true),
        gte(dasturxonEntriesTable.guestCount, guestMin),
        lte(dasturxonEntriesTable.guestCount, guestMax),
      ),
    );

  const avg = (nums: number[]) =>
    nums.length ? round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0;

  // Tally which dishes show up across similar weddings, most common first.
  const counts = new Map<string, number>();
  for (const entry of similarEntries) {
    const seen = new Set<string>();
    for (const item of entry.itemsList as DasturxonItem[]) {
      const name = item.itemName.trim();
      if (name.length === 0 || seen.has(name)) continue;
      seen.add(name);
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  const commonItems = [...counts.entries()]
    .map(([itemName, count]) => ({ itemName, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  res.json(
    GetDasturxonComparisonResponse.parse({
      hasPlan: true,
      plan: {
        planId: plan.id,
        city: plan.city,
        guestCount: plan.guestCount,
        plannedFoodSpend,
        plannedPerGuest,
        plannedMenu,
      },
      similar: {
        entryCount: similarEntries.length,
        guestMin,
        guestMax,
        avgFoodSpend: avg(similarEntries.map((e) => e.totalSpentOnFood)),
        avgPerGuest: avg(
          similarEntries.map((e) => perGuest(e.totalSpentOnFood, e.guestCount)),
        ),
        commonItems,
      },
    }),
  );
});

// POST /dasturxon — submit your own dasturxon after the wedding.
router.post("/dasturxon", async (req, res): Promise<void> => {
  const userId = getSessionUserId(req);
  if (userId === null) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  const parsed = CreateDasturxonBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;

  // The generated zod validates ranges but not integer-ness. Money is whole
  // UZS (bigint columns) and counts are integers, so reject fractional values
  // with a clean 400 instead of letting them hit the DB.
  const mustBeInt = [
    data.guestCount,
    data.totalSpentOnFood,
    ...data.items.map((i) => i.quantity),
    ...data.items.flatMap((i) => (i.approxCost != null ? [i.approxCost] : [])),
  ];
  if (!mustBeInt.every((n) => Number.isInteger(n))) {
    res.status(400).json({ error: "Numeric fields must be whole numbers" });
    return;
  }

  // Belt-and-suspenders: the zod schema enforces >= 2 photos, but re-check so a
  // stale client can't submit a photoless entry that would be hidden anyway.
  if (data.photos.length < 2) {
    res.status(400).json({ error: "Please add at least 2 photos" });
    return;
  }

  const [entry] = await db
    .insert(dasturxonEntriesTable)
    .values({
      userId,
      city: data.city,
      guestCount: data.guestCount,
      totalSpentOnFood: data.totalSpentOnFood,
      itemsList: data.items.map((i) => ({
        itemName: i.itemName,
        quantity: i.quantity,
        approxCost: i.approxCost ?? 0,
      })),
      photos: data.photos,
      isPublic: data.isPublic,
    })
    .returning();

  res.status(201).json(
    CreateDasturxonResponse.parse({ ...toSummary(entry), isPublic: entry.isPublic }),
  );
});

export default router;
