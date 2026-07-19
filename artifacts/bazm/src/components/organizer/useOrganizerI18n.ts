import { useTranslation } from "react-i18next";
import { formatUZS, formatNumber } from "@/lib/format";

const DATE_LOCALES: Record<string, string> = {
  uz: "uz-UZ",
  ru: "ru-RU",
  en: "en-GB",
};

const KNOWN_TIERS = ["budget", "standard", "premium"];

/**
 * Label, currency, and date helpers for the organizer dashboard, bound to the
 * current locale. Reuses the budget planner's shared category/city/tier
 * translations so terminology stays consistent across the app.
 */
export function useOrganizerI18n() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const dateLocale = DATE_LOCALES[locale] ?? "en-GB";

  return {
    t,
    locale,
    fmt: (amount: number) => formatUZS(amount, locale),
    num: (value: number) => formatNumber(value),
    categoryLabel: (category: string) =>
      t(`budget.categories.${category}`, { defaultValue: category }),
    cityLabel: (city: string) =>
      t(`budget.cities.${city}`, { defaultValue: city }),
    statusLabel: (status: string) =>
      t(`organizer.statuses.${status}`, { defaultValue: status }),
    tierLabel: (name: string | null | undefined) => {
      if (!name) return "";
      return KNOWN_TIERS.includes(name.toLowerCase())
        ? t(`budget.tiers.${name.toLowerCase()}`)
        : name;
    },
    /** Format an ISO "YYYY-MM-DD" date, or a placeholder when absent. */
    formatDate: (iso: string | null | undefined) => {
      if (!iso) return t("organizer.noDate");
      const parsed = new Date(`${iso}T00:00:00`);
      if (Number.isNaN(parsed.getTime())) return iso;
      return new Intl.DateTimeFormat(dateLocale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(parsed);
    },
  };
}
