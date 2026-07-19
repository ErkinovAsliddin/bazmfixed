/**
 * Food & product quantity estimates for the sufficiency calculator.
 *
 * These are deliberately *tunable constants*, not magic numbers scattered
 * through the calculation. They express "how much of X does one guest consume
 * at a typical Uzbek wedding" and are meant to be refined later with real
 * caterer / vendor input. Change the numbers here, not the engine below.
 *
 * Money is whole UZS (bigint mode:number) everywhere in this codebase.
 */

export const SUFFICIENCY_CATEGORIES = [
  "plov",
  "salads",
  "meat",
  "bread",
  "fruit",
  "sweets",
  "drinks",
  "tableware",
] as const;

export type SufficiencyCategory = (typeof SUFFICIENCY_CATEGORIES)[number];

export function isSufficiencyCategory(
  value: unknown,
): value is SufficiencyCategory {
  return (
    typeof value === "string" &&
    (SUFFICIENCY_CATEGORIES as readonly string[]).includes(value)
  );
}

/**
 * Safety buffer added on top of strict headcount math. A wedding is not a
 * headcount-exact event: guests bring plus-ones, and people eat more when the
 * food is good. 12% keeps hosts from running out without wild over-ordering.
 * Tune between ~0.10 and ~0.15.
 */
export const BUFFER_PERCENT = 0.12;

/**
 * A "typical" Uzbek wedding banquet length. Duration-sensitive categories
 * (mainly drinks) scale relative to this baseline; food served as set courses
 * is roughly fixed regardless of how long people linger.
 */
export const BASELINE_DURATION_HOURS = 4;

/** How much longer events are allowed to stretch the per-guest amount. */
export const MAX_DURATION_MULTIPLIER = 2;

export interface PortionEstimate {
  category: SufficiencyCategory;
  /** Display unit for the amount (kg, piece, liter, set). */
  unit: string;
  /** Base amount consumed per guest at the baseline event length. */
  perGuest: number;
  /** Rounding step for a clean, orderable amount (e.g. whole kg / whole set). */
  roundStep: number;
  /** True when longer events meaningfully increase consumption (drinks/tea). */
  durationSensitive: boolean;
  /**
   * When set, the calculator cross-references marketplace_products so hosts can
   * buy the recommended amount. `nameMatch` narrows a broad product category
   * (e.g. "wedding_products") to the specific SKU that fits this need.
   */
  marketplace?: {
    productCategory: string;
    nameMatch?: string;
  };
}

/**
 * Per-guest portion assumptions for a seated Uzbek wedding banquet. Amounts are
 * intentionally generous — this domain over-caters by tradition. These are
 * estimates, clearly labeled, and adjustable.
 */
export const PORTION_ESTIMATES: Record<SufficiencyCategory, PortionEstimate> = {
  // Osh / plov — the centerpiece. ~300 g cooked per guest.
  plov: {
    category: "plov",
    unit: "kg",
    perGuest: 0.3,
    roundStep: 1,
    durationSensitive: false,
  },
  // Assorted salads (achichuk, olivye, etc.).
  salads: {
    category: "salads",
    unit: "kg",
    perGuest: 0.15,
    roundStep: 1,
    durationSensitive: false,
  },
  // Meat dishes (kabob / grilled / boiled).
  meat: {
    category: "meat",
    unit: "kg",
    perGuest: 0.2,
    roundStep: 1,
    durationSensitive: false,
  },
  // Non (bread) — roughly half a round non per guest at the table.
  bread: {
    category: "bread",
    unit: "piece",
    perGuest: 0.5,
    roundStep: 1,
    durationSensitive: false,
  },
  // Fruit platters.
  fruit: {
    category: "fruit",
    unit: "kg",
    perGuest: 0.2,
    roundStep: 1,
    durationSensitive: false,
  },
  // Sweets / desserts (parvarda, pashmak, cakes).
  sweets: {
    category: "sweets",
    unit: "kg",
    perGuest: 0.15,
    roundStep: 1,
    durationSensitive: false,
  },
  // Drinks & tea — scales with how long guests are seated.
  drinks: {
    category: "drinks",
    unit: "liter",
    perGuest: 0.5,
    roundStep: 1,
    durationSensitive: true,
  },
  // Disposable tableware — one set per guest (plate, cup, cutlery).
  tableware: {
    category: "tableware",
    unit: "set",
    perGuest: 1,
    roundStep: 1,
    durationSensitive: false,
    marketplace: {
      productCategory: "wedding_products",
      nameMatch: "tableware",
    },
  },
};

export interface CategoryRecommendation {
  category: SufficiencyCategory;
  unit: string;
  perGuest: number;
  durationSensitive: boolean;
  /** Strict headcount math, no buffer — the honest lower edge of the range. */
  strictAmount: number;
  /** Headcount + buffer (+ duration for drinks) — what we recommend ordering. */
  recommendedAmount: number;
}

/** Round to a step, choosing floor or ceil so the range stays honest. */
function roundToStep(value: number, step: number, mode: "floor" | "ceil") {
  const fn = mode === "ceil" ? Math.ceil : Math.floor;
  const rounded = fn(value / step) * step;
  // Never recommend zero of a category the host explicitly selected.
  return rounded < step ? step : rounded;
}

/**
 * Pure, deterministic per-category recommendation. No DB, no I/O — the route
 * layers marketplace matches on top of this.
 */
export function recommendForCategory(
  category: SufficiencyCategory,
  guestCount: number,
  durationHours: number,
): CategoryRecommendation {
  const est = PORTION_ESTIMATES[category];

  const durationMultiplier = est.durationSensitive
    ? Math.min(
        MAX_DURATION_MULTIPLIER,
        Math.max(1, durationHours / BASELINE_DURATION_HOURS),
      )
    : 1;

  const base = est.perGuest * guestCount * durationMultiplier;
  const buffered = base * (1 + BUFFER_PERCENT);

  return {
    category,
    unit: est.unit,
    perGuest: est.perGuest,
    durationSensitive: est.durationSensitive,
    strictAmount: roundToStep(base, est.roundStep, "floor"),
    recommendedAmount: roundToStep(buffered, est.roundStep, "ceil"),
  };
}
