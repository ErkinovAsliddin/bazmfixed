import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useVendorI18n } from "./useVendorI18n";

const ALL = "__all__";

export const VENDOR_CATEGORIES = [
  "venue",
  "catering",
  "decor",
  "music",
  "photography",
  "clothing",
  "rental_items",
  "wedding_products",
] as const;

export function VendorFilters({
  category,
  city,
  cities,
  onCategory,
  onCity,
}: {
  category: string | null;
  city: string | null;
  cities: string[];
  onCategory: (value: string | null) => void;
  onCity: (value: string | null) => void;
}) {
  const { t, categoryLabel, cityLabel } = useVendorI18n();
  const hasFilters = category !== null || city !== null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={category ?? ALL}
        onValueChange={(v) => onCategory(v === ALL ? null : v)}
      >
        <SelectTrigger className="w-[190px]" data-testid="filter-category">
          <SelectValue placeholder={t("vendors.filters.category")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t("vendors.filters.allCategories")}</SelectItem>
          {VENDOR_CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>
              {categoryLabel(c)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={city ?? ALL}
        onValueChange={(v) => onCity(v === ALL ? null : v)}
      >
        <SelectTrigger className="w-[190px]" data-testid="filter-city">
          <SelectValue placeholder={t("vendors.filters.city")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t("vendors.filters.allCities")}</SelectItem>
          {cities.map((c) => (
            <SelectItem key={c} value={c}>
              {cityLabel(c)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onCategory(null);
            onCity(null);
          }}
          data-testid="filter-clear"
        >
          {t("vendors.filters.clear")}
        </Button>
      )}
    </div>
  );
}
