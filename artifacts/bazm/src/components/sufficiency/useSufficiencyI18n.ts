import { useTranslation } from "react-i18next";
import {
  Utensils,
  Salad,
  Beef,
  Wheat,
  Apple,
  Cake,
  CupSoda,
  Package,
  type LucideIcon,
} from "lucide-react";
import { formatUZS, formatNumber } from "@/lib/format";
import type { SufficiencyCategory } from "@workspace/api-client-react";

/** Canonical category order + icon, mirroring the server's PORTION_ESTIMATES. */
export const SUFFICIENCY_CATEGORIES: {
  key: SufficiencyCategory;
  icon: LucideIcon;
}[] = [
  { key: "plov", icon: Utensils },
  { key: "salads", icon: Salad },
  { key: "meat", icon: Beef },
  { key: "bread", icon: Wheat },
  { key: "fruit", icon: Apple },
  { key: "sweets", icon: Cake },
  { key: "drinks", icon: CupSoda },
  { key: "tableware", icon: Package },
];

/**
 * Label + currency helpers for the sufficiency calculator, bound to the current
 * locale. Category labels keep local food names (osh/plov, non, choy) intact.
 */
export function useSufficiencyI18n() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  return {
    t,
    locale,
    fmt: (amount: number) => formatUZS(amount, locale),
    num: (value: number) => formatNumber(value),
    categoryLabel: (key: string) => t(`sufficiency.categories.${key}.label`),
    categoryNote: (key: string) => t(`sufficiency.categories.${key}.note`),
    /** Localized unit label with the numeric amount, e.g. "51 kg" / "169 to'plam". */
    amountLabel: (amount: number, unit: string) =>
      `${formatNumber(amount)} ${t(`sufficiency.units.${unit}`, { defaultValue: unit })}`,
  };
}
