/**
 * The marketplace product taxonomy shared by the buyer marketplace filters and
 * the seller's product form. Labels come from i18n (`marketplace.categories.*`).
 */
export const PRODUCT_CATEGORIES = [
  "decor",
  "disposable_tableware",
  "rental_items",
  "gifts_sarpo",
  "food_products",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

/** Categories offered as buyer filters — the taxonomy plus an "all" option. */
export const MARKETPLACE_FILTERS = ["all", ...PRODUCT_CATEGORIES] as const;
