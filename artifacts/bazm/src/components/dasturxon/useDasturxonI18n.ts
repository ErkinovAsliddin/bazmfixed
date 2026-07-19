import { useTranslation } from "react-i18next";
import { formatUZS, formatNumber } from "@/lib/format";

/** Canonical dish keys we have real trilingual labels for. */
const DISH_KEYS = [
  "plov",
  "salads",
  "grilled_meats",
  "bread",
  "appetizers",
  "sweets",
  "fruit",
  "tea",
  "drinks",
  "dasturxon_spread",
] as const;

export type DishKey = (typeof DISH_KEYS)[number];

/**
 * Quick-add suggestions for the submit form. The stored `itemName` is a stable
 * canonical string; the display layer re-localizes it via `dishLabel`, so a
 * dish saved in one language still reads correctly in the others.
 */
export const SUGGESTED_DISHES: { key: DishKey; itemName: string }[] = [
  { key: "plov", itemName: "Plov" },
  { key: "salads", itemName: "Salads" },
  { key: "grilled_meats", itemName: "Grilled meats" },
  { key: "bread", itemName: "Non" },
  { key: "appetizers", itemName: "Cold appetizers" },
  { key: "sweets", itemName: "Sweets" },
  { key: "fruit", itemName: "Fruit" },
  { key: "tea", itemName: "Choy" },
  { key: "drinks", itemName: "Drinks" },
  { key: "dasturxon_spread", itemName: "Dasturxon spread" },
];

function tokens(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-zа-яё]+/i)
    .filter(Boolean);
}

/**
 * Map a free-text dish name (from seed data or user submissions, in any of the
 * three languages) to a canonical key so we can show a localized label. Returns
 * null for anything we don't recognize — those are shown verbatim.
 */
export function normalizeDishKey(name: string): DishKey | null {
  const lower = name.toLowerCase();
  const tks = tokens(name);
  const has = (w: string) => lower.includes(w);
  const hasToken = (w: string) => tks.includes(w);

  if (hasToken("osh") || has("plov") || has("плов") || has("палов")) return "plov";
  if (has("salad") || has("salat") || has("салат")) return "salads";
  if (
    has("shashlik") ||
    has("kabob") ||
    has("kebab") ||
    has("grill") ||
    has("meat") ||
    has("шашлык") ||
    has("мясо") ||
    has("go'sht") ||
    has("gosht")
  )
    return "grilled_meats";
  if (hasToken("non") || has("bread") || has("лепёшк") || has("лепешк")) return "bread";
  if (
    has("sweet") ||
    has("dessert") ||
    has("pastr") ||
    has("shirin") ||
    has("слад") ||
    has("десерт")
  )
    return "sweets";
  if (has("fruit") || has("meva") || has("фрукт")) return "fruit";
  if (has("drink") || has("ichim") || has("напит")) return "drinks";
  if (hasToken("tea") || has("choy") || has("chay") || has("чай")) return "tea";
  if (has("appetiz") || has("gazak") || has("zakusk") || has("закуск")) return "appetizers";
  if (has("dasturxon") || has("дастур")) return "dasturxon_spread";
  return null;
}

/**
 * Label + currency helpers for the dasturxon feature, bound to the current
 * locale. Reuses the budget planner's city translations and adds a dish
 * dictionary that keeps local food names (osh, non, choy) intact.
 */
export function useDasturxonI18n() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  return {
    t,
    locale,
    fmt: (amount: number) => formatUZS(amount, locale),
    num: (value: number) => formatNumber(value),
    cityLabel: (city: string) =>
      t(`budget.cities.${city}`, { defaultValue: city }),
    dishLabel: (name: string) => {
      const key = normalizeDishKey(name);
      return key ? t(`dasturxon.dishes.${key}`) : name;
    },
  };
}
