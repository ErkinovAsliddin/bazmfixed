const UZS_SUFFIX: Record<string, string> = {
  uz: "so'm",
  ru: "сум",
  en: "UZS",
};

/** Group a whole number with spaces, e.g. 199000000 -> "199 000 000". */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(
    Math.round(value),
  );
}

/** Format a whole-UZS amount with grouping and a locale-aware currency suffix. */
export function formatUZS(amount: number, locale = "uz"): string {
  const suffix = UZS_SUFFIX[locale] ?? UZS_SUFFIX.uz;
  return `${formatNumber(amount)} ${suffix}`;
}
