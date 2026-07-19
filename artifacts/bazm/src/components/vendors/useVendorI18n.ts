import { useTranslation } from "react-i18next";
import { formatUZS, formatNumber } from "@/lib/format";

const KNOWN_TIERS = ["budget", "standard", "premium"];

/**
 * Label + currency helpers for the vendor marketplace, bound to the current
 * locale. Reuses the budget planner's shared city/unit/tier translations so the
 * two features stay consistent, and adds the full vendor category set.
 */
export function useVendorI18n() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  return {
    t,
    locale,
    fmt: (amount: number) => formatUZS(amount, locale),
    num: (value: number) => formatNumber(value),
    categoryLabel: (category: string) =>
      t(`vendors.categories.${category}`, { defaultValue: category }),
    cityLabel: (city: string) =>
      t(`budget.cities.${city}`, { defaultValue: city }),
    unitLabel: (unit: string) =>
      t(`budget.units.${unit}`, { defaultValue: unit }),
    tierLabel: (name: string) =>
      KNOWN_TIERS.includes(name.toLowerCase())
        ? t(`budget.tiers.${name.toLowerCase()}`)
        : name,
  };
}
