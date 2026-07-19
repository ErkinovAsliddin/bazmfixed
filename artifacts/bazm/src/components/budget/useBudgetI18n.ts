import { useTranslation } from "react-i18next";
import { formatUZS, formatNumber } from "@/lib/format";

/**
 * Shared label + currency helpers for the budget planner, bound to the current
 * locale. Keeps category/tier/unit/city labels and money formatting consistent
 * across the form, results, breakdown, scenarios, and share views.
 */
export function useBudgetI18n() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  return {
    t,
    locale,
    fmt: (amount: number) => formatUZS(amount, locale),
    num: (value: number) => formatNumber(value),
    categoryLabel: (category: string) => t(`budget.categories.${category}`),
    tierLabel: (level: string) => t(`budget.tiers.${level}`),
    unitLabel: (unit: string) => t(`budget.units.${unit}`),
    cityLabel: (city: string) => t(`budget.cities.${city}`, { defaultValue: city }),
  };
}
