import { z } from "zod";
import { EstimateBudgetBody, EstimateBudgetResponse } from "@workspace/api-zod";
import type { Vendor, VendorTier } from "@workspace/db";

/**
 * Pure wedding-budget computation engine.
 *
 * Given a couple's inputs (city, guest count, optional budget, priority ranking)
 * and a catalog of vendors + tiers, it produces a category-by-category cost
 * breakdown, a "is my money enough?" sufficiency check, concrete adjustment
 * options when short, upgrade suggestions when there's room, and side-by-side
 * scenarios at smaller guest counts.
 *
 * All money is whole UZS. This module does no I/O — the route loads the catalog
 * and validates the result against the OpenAPI zod schema.
 */

export const PLANNER_CATEGORIES = [
  "venue",
  "catering",
  "decor",
  "music",
  "photography",
  "clothing",
] as const;

type PlannerCat = (typeof PLANNER_CATEGORIES)[number];
type Level = "budget" | "standard" | "premium";

export type EstimateInput = z.infer<typeof EstimateBudgetBody>;
export type BudgetEstimate = z.infer<typeof EstimateBudgetResponse>;
type CategoryEstimate = BudgetEstimate["categories"][number];
type Adjustment = BudgetEstimate["sufficiency"]["adjustments"][number];
type Upgrade = BudgetEstimate["sufficiency"]["upgrades"][number];
type Scenario = BudgetEstimate["scenarios"][number];

export type CatalogVendor = Vendor & { tiers: VendorTier[] };
/** Vendors grouped by planner category. */
export type Catalog = Map<string, CatalogVendor[]>;

/**
 * Pick a representative vendor for a category: prefer one in the couple's city
 * (unless "Other"), then verified vendors, then the lowest id for stability.
 */
function pickVendor(
  vendors: CatalogVendor[],
  city: string,
): CatalogVendor | null {
  if (vendors.length === 0) return null;
  const cityMatches =
    city !== "Other" ? vendors.filter((v) => v.city === city) : [];
  const pool = cityMatches.length > 0 ? cityMatches : vendors;
  return [...pool].sort(
    (a, b) => Number(b.isVerified) - Number(a.isVerified) || a.id - b.id,
  )[0];
}

/**
 * Pick the tier matching a level. Tiers are matched by name first (seed data
 * uses budget/standard/premium), falling back to price rank so vendors that
 * don't offer every level still resolve to the closest available tier.
 */
function pickTier(tiers: VendorTier[], level: Level): VendorTier {
  const sorted = [...tiers].sort((a, b) => a.pricePerUnit - b.pricePerUnit);
  const byName = sorted.find((t) => t.tierName.toLowerCase() === level);
  if (byName) return byName;
  if (level === "budget") return sorted[0];
  if (level === "premium") return sorted[sorted.length - 1];
  return sorted[Math.floor((sorted.length - 1) / 2)];
}

/** Cost of a tier for a given guest count, based on its unit type. */
function tierCost(tier: VendorTier, guestCount: number): number {
  return tier.unitType === "per_guest"
    ? tier.pricePerUnit * guestCount
    : tier.pricePerUnit;
}

type Chosen = {
  category: PlannerCat;
  vendor: CatalogVendor;
  tier: VendorTier;
  level: Level;
  isPriority: boolean;
};

function buildCategoryEstimate(
  c: Chosen,
  guestCount: number,
): CategoryEstimate {
  return {
    category: c.category,
    tierLevel: c.level,
    vendorId: c.vendor.id,
    vendorName: c.vendor.businessName,
    vendorCity: c.vendor.city,
    tierId: c.tier.id,
    tierName: c.tier.tierName,
    unitType: c.tier.unitType,
    pricePerUnit: c.tier.pricePerUnit,
    estimatedCost: tierCost(c.tier, guestCount),
    isPriority: c.isPriority,
  };
}

export function computeEstimate(
  input: EstimateInput,
  catalog: Catalog,
): BudgetEstimate {
  const { city, guestCount } = input;
  const totalBudget =
    input.totalBudget === undefined ? null : input.totalBudget;
  const priorities = (input.priorities ?? []).filter((p): p is PlannerCat =>
    (PLANNER_CATEGORIES as readonly string[]).includes(p),
  );
  const topTwo = priorities.slice(0, 2);

  // ---- Recommended tier per category (priority-driven) ----
  const chosen: Chosen[] = [];
  for (const category of PLANNER_CATEGORIES) {
    const vendors = catalog.get(category) ?? [];
    const vendor = pickVendor(vendors, city);
    if (!vendor || vendor.tiers.length === 0) continue;
    const isPriority = topTwo.includes(category);
    const level: Level = isPriority ? "premium" : "standard";
    chosen.push({
      category,
      vendor,
      tier: pickTier(vendor.tiers, level),
      level,
      isPriority,
    });
  }

  const categories = chosen.map((c) => buildCategoryEstimate(c, guestCount));
  const estimatedTotal = categories.reduce((s, c) => s + c.estimatedCost, 0);

  // Split fixed vs per-guest cost so we can recompute totals at other guest
  // counts cheaply (only per-guest lines scale).
  const fixedSum = chosen
    .filter((c) => c.tier.unitType !== "per_guest")
    .reduce((s, c) => s + c.tier.pricePerUnit, 0);
  const perGuestSum = chosen
    .filter((c) => c.tier.unitType === "per_guest")
    .reduce((s, c) => s + c.tier.pricePerUnit, 0);
  const totalAt = (g: number) => fixedSum + perGuestSum * g;

  // ---- Scenarios at the current / -30% / -50% guest counts ----
  const scenarios: Scenario[] = (
    [
      ["current", 1],
      ["minus30", 0.7],
      ["minus50", 0.5],
    ] as const
  ).map(([key, factor]) => {
    const g = Math.max(1, Math.round(guestCount * factor));
    return { key, guestCount: g, total: totalAt(g) };
  });

  // ---- Sufficiency check ----
  const sufficiency = computeSufficiency({
    totalBudget,
    estimatedTotal,
    guestCount,
    chosen,
    fixedSum,
    perGuestSum,
    totalAt,
    catalog,
  });

  return {
    city,
    guestCount,
    totalBudget,
    priorities,
    categories,
    estimatedTotal,
    recommendedBudget: estimatedTotal,
    sufficiency,
    scenarios,
  };
}

function computeSufficiency(args: {
  totalBudget: number | null;
  estimatedTotal: number;
  guestCount: number;
  chosen: Chosen[];
  fixedSum: number;
  perGuestSum: number;
  totalAt: (g: number) => number;
  catalog: Catalog;
}): BudgetEstimate["sufficiency"] {
  const {
    totalBudget,
    estimatedTotal,
    guestCount,
    chosen,
    fixedSum,
    perGuestSum,
    totalAt,
    catalog,
  } = args;

  if (totalBudget === null) {
    return { status: "unknown", difference: null, adjustments: [], upgrades: [] };
  }

  const diff = totalBudget - estimatedTotal;

  if (diff >= 0) {
    return {
      status: "sufficient",
      difference: diff,
      adjustments: [],
      upgrades: computeUpgrades(chosen, catalog, guestCount, diff),
    };
  }

  return {
    status: "short",
    difference: -diff,
    adjustments: computeAdjustments({
      totalBudget,
      estimatedTotal,
      guestCount,
      chosen,
      fixedSum,
      perGuestSum,
      totalAt,
    }),
    upgrades: [],
  };
}

function computeAdjustments(args: {
  totalBudget: number;
  estimatedTotal: number;
  guestCount: number;
  chosen: Chosen[];
  fixedSum: number;
  perGuestSum: number;
  totalAt: (g: number) => number;
}): Adjustment[] {
  const {
    totalBudget,
    estimatedTotal,
    guestCount,
    chosen,
    fixedSum,
    perGuestSum,
    totalAt,
  } = args;
  const candidates: Adjustment[] = [];

  // 1) Trim the guest list so the per-guest costs fit the budget.
  if (perGuestSum > 0) {
    const maxG = Math.floor((totalBudget - fixedSum) / perGuestSum);
    if (maxG >= 1 && maxG < guestCount) {
      const newTotal = totalAt(maxG);
      candidates.push({
        kind: "reduce_guests",
        category: null,
        fromTierLevel: null,
        toTierLevel: null,
        fromGuestCount: guestCount,
        toGuestCount: maxG,
        newTotal,
        newDifference: totalBudget - newTotal,
      });
    }
  }

  // 2) Downgrade the priority (premium) category that saves the most.
  let bestDowngrade: Adjustment | null = null;
  for (const c of chosen) {
    if (c.level !== "premium") continue;
    const standardTier = pickTier(c.vendor.tiers, "standard");
    const saving = tierCost(c.tier, guestCount) - tierCost(standardTier, guestCount);
    if (saving <= 0) continue;
    const newTotal = estimatedTotal - saving;
    if (!bestDowngrade || newTotal < bestDowngrade.newTotal) {
      bestDowngrade = {
        kind: "downgrade_category",
        category: c.category,
        fromTierLevel: "premium",
        toTierLevel: "standard",
        fromGuestCount: null,
        toGuestCount: null,
        newTotal,
        newDifference: totalBudget - newTotal,
      };
    }
  }
  if (bestDowngrade) candidates.push(bestDowngrade);

  // 3) Go lean: budget tier across every category.
  const leanTotal = chosen.reduce(
    (s, c) => s + tierCost(pickTier(c.vendor.tiers, "budget"), guestCount),
    0,
  );
  if (leanTotal < estimatedTotal) {
    candidates.push({
      kind: "downgrade_all",
      category: null,
      fromTierLevel: null,
      toTierLevel: "budget",
      fromGuestCount: null,
      toGuestCount: null,
      newTotal: leanTotal,
      newDifference: totalBudget - leanTotal,
    });
  }

  // Prefer options that actually make it fit, then the biggest savings.
  return candidates
    .filter((a) => a.newTotal < estimatedTotal)
    .sort(
      (a, b) =>
        Number(b.newDifference >= 0) - Number(a.newDifference >= 0) ||
        a.newTotal - b.newTotal,
    )
    .slice(0, 3);
}

/** Highest realistic premium cost for a category across the whole catalog. */
function categoryPremiumCost(
  catalog: Catalog,
  category: string,
  guestCount: number,
): number {
  const vendors = catalog.get(category) ?? [];
  let max = 0;
  for (const v of vendors) {
    if (v.tiers.length === 0) continue;
    const cost = tierCost(pickTier(v.tiers, "premium"), guestCount);
    if (cost > max) max = cost;
  }
  return max;
}

function computeUpgrades(
  chosen: Chosen[],
  catalog: Catalog,
  guestCount: number,
  surplus: number,
): Upgrade[] {
  const currentTotal = chosen.reduce(
    (s, c) => s + tierCost(c.tier, guestCount),
    0,
  );
  const upgrades: Upgrade[] = [];

  for (const c of chosen) {
    if (c.level === "premium") continue;
    // Premium ceiling comes from the whole category catalog so a couple with a
    // surplus still gets suggestions even when their local vendor tops out at
    // "standard".
    const premiumCost = categoryPremiumCost(catalog, c.category, guestCount);
    const additionalCost = premiumCost - tierCost(c.tier, guestCount);
    if (additionalCost <= 0 || additionalCost > surplus) continue;
    upgrades.push({
      category: c.category,
      fromTierLevel: c.level,
      toTierLevel: "premium",
      additionalCost,
      newTotal: currentTotal + additionalCost,
    });
  }

  // Cheapest meaningful upgrades first so the surplus stretches further.
  return upgrades.sort((a, b) => a.additionalCost - b.additionalCost).slice(0, 3);
}

/** Convert an ordered priority list into stored weights (higher = more important). */
export function prioritiesToWeights(
  priorities: string[],
): Record<string, number> {
  return Object.fromEntries(
    priorities.map((c, i) => [c, priorities.length - i]),
  );
}

/** Reconstruct the ordered priority list from stored weights. */
export function weightsToPriorities(
  weights: Record<string, number> | null,
): PlannerCat[] {
  if (!weights) return [];
  return Object.entries(weights)
    .sort((a, b) => b[1] - a[1])
    .map(([c]) => c)
    .filter((c): c is PlannerCat =>
      (PLANNER_CATEGORIES as readonly string[]).includes(c),
    );
}
