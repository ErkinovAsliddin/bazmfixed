import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import {
  db,
  vendorsTable,
  vendorTiersTable,
  budgetPlansTable,
  budgetPlanItemsTable,
  type Vendor,
  type VendorTier,
} from "@workspace/db";
import {
  EstimateBudgetBody,
  EstimateBudgetResponse,
  CreateBudgetPlanBody,
  CreateBudgetPlanResponse,
  ListBudgetPlansResponse,
  GetBudgetPlanResponse,
  GetSharedBudgetPlanResponse,
  GetBudgetOptionsResponse,
} from "@workspace/api-zod";
import { getSessionUserId } from "../lib/auth";
import {
  computeEstimate,
  PLANNER_CATEGORIES,
  type Catalog,
  type CatalogVendor,
} from "../lib/budget-engine";

const router: IRouter = Router();

// Venue and catering are always flagged as the two big-ticket priorities.
const PRIORITY_CATEGORIES = new Set(["venue", "catering"]);
const CITY_OPTIONS = ["Tashkent", "Samarkand", "Bukhara", "Other"] as const;

/** Cost of a tier for a given guest count, based on its unit type. */
function tierCost(tier: VendorTier, guestCount: number): number {
  return tier.unitType === "per_guest"
    ? tier.pricePerUnit * guestCount
    : tier.pricePerUnit;
}

// ---------------------------------------------------------------------------
// Public quick estimator (engine-based, unchanged) — kept for /budget/estimate.
// ---------------------------------------------------------------------------

/** Load all planner-category vendors with their tiers, grouped by category. */
async function loadCatalog(): Promise<Catalog> {
  const vendors = await db
    .select()
    .from(vendorsTable)
    .where(inArray(vendorsTable.category, [...PLANNER_CATEGORIES]));

  const vendorIds = vendors.map((v) => v.id);
  const tiers: VendorTier[] = vendorIds.length
    ? await db
        .select()
        .from(vendorTiersTable)
        .where(inArray(vendorTiersTable.vendorId, vendorIds))
    : [];

  const tiersByVendor = new Map<number, VendorTier[]>();
  for (const tier of tiers) {
    const list = tiersByVendor.get(tier.vendorId) ?? [];
    list.push(tier);
    tiersByVendor.set(tier.vendorId, list);
  }

  const catalog: Catalog = new Map();
  for (const vendor of vendors) {
    const withTiers: CatalogVendor = {
      ...vendor,
      tiers: tiersByVendor.get(vendor.id) ?? [],
    };
    const list = catalog.get(vendor.category) ?? [];
    list.push(withTiers);
    catalog.set(vendor.category, list);
  }
  return catalog;
}

// POST /budget/estimate — public, no persistence.
router.post("/budget/estimate", async (req, res): Promise<void> => {
  const parsed = EstimateBudgetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const catalog = await loadCatalog();
  const estimate = computeEstimate(parsed.data, catalog);
  res.json(EstimateBudgetResponse.parse(estimate));
});

// ---------------------------------------------------------------------------
// Manual per-category picker
// ---------------------------------------------------------------------------

// GET /budget/options — verified vendor tiers per category, cheapest first.
router.get("/budget/options", async (req, res): Promise<void> => {
  const city = req.query.city;
  const guestRaw = Number(req.query.guestCount);
  if (
    typeof city !== "string" ||
    !(CITY_OPTIONS as readonly string[]).includes(city)
  ) {
    res.status(400).json({ error: "A valid city is required" });
    return;
  }
  if (!Number.isInteger(guestRaw) || guestRaw < 1 || guestRaw > 5000) {
    res.status(400).json({ error: "A valid guest count is required" });
    return;
  }
  const guestCount = guestRaw;

  // Verified + active vendors in the chosen city (or any city when "Other").
  const filters = [
    eq(vendorsTable.isVerified, true),
    eq(vendorsTable.isActive, true),
    inArray(vendorsTable.category, [...PLANNER_CATEGORIES]),
  ];
  if (city !== "Other") filters.push(eq(vendorsTable.city, city));

  const vendors = await db
    .select()
    .from(vendorsTable)
    .where(and(...filters));
  const vendorById = new Map(vendors.map((v) => [v.id, v]));

  const tiers = vendors.length
    ? await db
        .select()
        .from(vendorTiersTable)
        .where(
          inArray(
            vendorTiersTable.vendorId,
            vendors.map((v) => v.id),
          ),
        )
    : [];

  const byCategory = new Map<
    string,
    ReturnType<typeof buildOptionTier>[]
  >();
  for (const tier of tiers) {
    const vendor = vendorById.get(tier.vendorId);
    if (!vendor) continue;
    const list = byCategory.get(vendor.category) ?? [];
    list.push(buildOptionTier(vendor, tier, guestCount));
    byCategory.set(vendor.category, list);
  }

  const result = PLANNER_CATEGORIES.map((category) => {
    const list = (byCategory.get(category) ?? []).sort(
      (a, b) => a.pricePerUnit - b.pricePerUnit,
    );
    return {
      category,
      isPriority: PRIORITY_CATEGORIES.has(category),
      tiers: list,
    };
  });

  res.json(GetBudgetOptionsResponse.parse(result));
});

function buildOptionTier(vendor: Vendor, tier: VendorTier, guestCount: number) {
  return {
    vendorId: vendor.id,
    vendorName: vendor.businessName,
    vendorCity: vendor.city,
    isVerified: vendor.isVerified,
    tierId: tier.id,
    tierName: tier.tierName,
    unitType: tier.unitType,
    pricePerUnit: tier.pricePerUnit,
    description: tier.description,
    photos: tier.photos.length > 0 ? tier.photos : vendor.photos,
    estimatedCost: tierCost(tier, guestCount),
  };
}

type ManualPlanView = ReturnType<typeof buildManualView>;

/** Build the saved-plan breakdown from stored selections joined to live data. */
function buildManualView(
  plan: {
    city: string;
    guestCount: number;
    totalBudget: number | null;
  },
  items: {
    category: string;
    estimatedCost: number;
    chosenVendorTierId: number | null;
  }[],
  tierById: Map<number, VendorTier>,
  vendorById: Map<number, Vendor>,
) {
  const built = items
    .filter((i) => i.chosenVendorTierId != null)
    .map((i) => {
      const tier = tierById.get(i.chosenVendorTierId as number);
      const vendor = tier ? vendorById.get(tier.vendorId) : undefined;
      return { item: i, tier, vendor };
    })
    .filter((x): x is { item: typeof x.item; tier: VendorTier; vendor: Vendor } =>
      Boolean(x.tier && x.vendor),
    )
    .map(({ item, tier, vendor }) => ({
      category: item.category,
      isPriority: PRIORITY_CATEGORIES.has(item.category),
      vendorId: vendor.id,
      vendorName: vendor.businessName,
      city: vendor.city,
      tierId: tier.id,
      tierName: tier.tierName,
      unitType: tier.unitType,
      pricePerUnit: tier.pricePerUnit,
      estimatedCost: item.estimatedCost,
      photos: tier.photos.length > 0 ? tier.photos : vendor.photos,
    }));

  const estimatedTotal = built.reduce((s, i) => s + i.estimatedCost, 0);
  const totalBudget = plan.totalBudget;
  const difference = totalBudget === null ? null : totalBudget - estimatedTotal;
  const status =
    totalBudget === null
      ? "unknown"
      : estimatedTotal <= totalBudget
        ? "sufficient"
        : "short";

  return {
    city: plan.city,
    guestCount: plan.guestCount,
    totalBudget,
    estimatedTotal,
    status: status as "sufficient" | "short" | "unknown",
    difference,
    items: built,
  };
}

/** Load the stored plan items and resolve them into a ManualPlanView. */
async function loadManualView(plan: {
  id: number;
  city: string;
  guestCount: number;
  totalBudget: number | null;
}): Promise<ManualPlanView> {
  const items = await db
    .select()
    .from(budgetPlanItemsTable)
    .where(eq(budgetPlanItemsTable.budgetPlanId, plan.id));

  const tierIds = items
    .map((i) => i.chosenVendorTierId)
    .filter((id): id is number => id != null);
  const tiers = tierIds.length
    ? await db
        .select()
        .from(vendorTiersTable)
        .where(inArray(vendorTiersTable.id, tierIds))
    : [];
  const tierById = new Map(tiers.map((t) => [t.id, t]));
  const vendorIds = [...new Set(tiers.map((t) => t.vendorId))];
  const vendors = vendorIds.length
    ? await db
        .select()
        .from(vendorsTable)
        .where(inArray(vendorsTable.id, vendorIds))
    : [];
  const vendorById = new Map(vendors.map((v) => [v.id, v]));

  return buildManualView(plan, items, tierById, vendorById);
}

// POST /budget/plans — save the couple's manual selections.
router.post("/budget/plans", async (req, res): Promise<void> => {
  const userId = getSessionUserId(req);
  if (userId === null) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  const parsed = CreateBudgetPlanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { title, city, guestCount, totalBudget, selections } = parsed.data;

  // Only one selection per category, and each tier must belong to a verified,
  // active vendor in the right planner category — never trust the client.
  const seen = new Set<string>();
  for (const s of selections) {
    if (seen.has(s.category)) {
      res.status(400).json({ error: "Only one vendor per category" });
      return;
    }
    seen.add(s.category);
  }

  const tierIds = selections.map((s) => s.vendorTierId);
  const rows = tierIds.length
    ? await db
        .select({ tier: vendorTiersTable, vendor: vendorsTable })
        .from(vendorTiersTable)
        .innerJoin(
          vendorsTable,
          eq(vendorTiersTable.vendorId, vendorsTable.id),
        )
        .where(
          and(
            inArray(vendorTiersTable.id, tierIds),
            eq(vendorsTable.isVerified, true),
            eq(vendorsTable.isActive, true),
          ),
        )
    : [];
  const rowByTier = new Map(rows.map((r) => [r.tier.id, r]));

  const itemsToInsert: {
    category: (typeof selections)[number]["category"];
    estimatedCost: number;
    chosenVendorTierId: number;
  }[] = [];
  for (const s of selections) {
    const row = rowByTier.get(s.vendorTierId);
    // The vendor must be verified+active, match the selected category, and —
    // unless the plan city is the catch-all "Other" — serve the plan's city.
    // Never trust the client to only send eligible tiers.
    const cityOk = city === "Other" || row?.vendor.city === city;
    if (!row || row.vendor.category !== s.category || !cityOk) {
      res.status(400).json({
        error: "One of the selected vendors is no longer available",
      });
      return;
    }
    itemsToInsert.push({
      category: s.category,
      estimatedCost: tierCost(row.tier, guestCount),
      chosenVendorTierId: s.vendorTierId,
    });
  }

  const [plan] = await db
    .insert(budgetPlansTable)
    .values({
      userId,
      title: title ?? null,
      city,
      guestCount,
      totalBudget: totalBudget ?? null,
      priorities: null,
      shareToken: randomUUID(),
    })
    .returning();

  if (itemsToInsert.length > 0) {
    await db.insert(budgetPlanItemsTable).values(
      itemsToInsert.map((i) => ({ budgetPlanId: plan.id, ...i })),
    );
  }

  const view = await loadManualView(plan);
  res.status(201).json(
    CreateBudgetPlanResponse.parse({
      id: plan.id,
      title: plan.title,
      shareToken: plan.shareToken,
      createdAt: plan.createdAt,
      plan: view,
    }),
  );
});

// GET /budget/plans — list the user's saved plans.
router.get("/budget/plans", async (req, res): Promise<void> => {
  const userId = getSessionUserId(req);
  if (userId === null) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  const plans = await db
    .select()
    .from(budgetPlansTable)
    .where(eq(budgetPlansTable.userId, userId))
    .orderBy(desc(budgetPlansTable.createdAt));

  const summaries = await Promise.all(
    plans.map(async (plan) => {
      const view = await loadManualView(plan);
      return {
        id: plan.id,
        title: plan.title,
        city: plan.city,
        guestCount: plan.guestCount,
        totalBudget: plan.totalBudget,
        estimatedTotal: view.estimatedTotal,
        status: view.status,
        shareToken: plan.shareToken,
        createdAt: plan.createdAt,
      };
    }),
  );

  res.json(ListBudgetPlansResponse.parse(summaries));
});

// GET /budget/plans/:id — full breakdown for one owned plan.
router.get("/budget/plans/:id", async (req, res): Promise<void> => {
  const userId = getSessionUserId(req);
  if (userId === null) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(404).json({ error: "Plan not found" });
    return;
  }

  const [plan] = await db
    .select()
    .from(budgetPlansTable)
    .where(and(eq(budgetPlansTable.id, id), eq(budgetPlansTable.userId, userId)));

  if (!plan) {
    res.status(404).json({ error: "Plan not found" });
    return;
  }

  const view = await loadManualView(plan);
  res.json(
    GetBudgetPlanResponse.parse({
      id: plan.id,
      title: plan.title,
      shareToken: plan.shareToken,
      createdAt: plan.createdAt,
      plan: view,
    }),
  );
});

// GET /budget/shared/:token — public read-only "share with family" view.
router.get("/budget/shared/:token", async (req, res): Promise<void> => {
  const [plan] = await db
    .select()
    .from(budgetPlansTable)
    .where(eq(budgetPlansTable.shareToken, req.params.token));

  if (!plan) {
    res.status(404).json({ error: "Plan not found" });
    return;
  }

  const view = await loadManualView(plan);
  res.json(
    GetSharedBudgetPlanResponse.parse({
      title: plan.title,
      createdAt: plan.createdAt,
      plan: view,
    }),
  );
});

export default router;
