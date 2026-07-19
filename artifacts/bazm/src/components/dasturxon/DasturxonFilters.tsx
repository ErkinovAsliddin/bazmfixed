import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useDasturxonI18n } from "./useDasturxonI18n";

const ALL = "__all__";

export type GuestRange = { min: number | null; max: number | null };

export function DasturxonFilters({
  city,
  cities,
  range,
  onCity,
  onRange,
}: {
  city: string | null;
  cities: string[];
  range: GuestRange;
  onCity: (value: string | null) => void;
  onRange: (value: GuestRange) => void;
}) {
  const { t, cityLabel } = useDasturxonI18n();
  const hasFilters =
    city !== null || range.min !== null || range.max !== null;

  const parse = (raw: string): number | null => {
    const n = Number(raw);
    return raw.trim() !== "" && Number.isFinite(n) && n >= 0
      ? Math.floor(n)
      : null;
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          {t("dasturxon.filters.city")}
        </Label>
        <Select
          value={city ?? ALL}
          onValueChange={(v) => onCity(v === ALL ? null : v)}
        >
          <SelectTrigger className="w-[180px]" data-testid="dx-filter-city">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("dasturxon.filters.allCities")}</SelectItem>
            {cities.map((c) => (
              <SelectItem key={c} value={c}>
                {cityLabel(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="dx-min" className="text-xs text-muted-foreground">
          {t("dasturxon.filters.minGuests")}
        </Label>
        <Input
          id="dx-min"
          type="number"
          min={0}
          className="w-[130px]"
          value={range.min ?? ""}
          placeholder={t("dasturxon.filters.any")}
          onChange={(e) => onRange({ ...range, min: parse(e.target.value) })}
          data-testid="dx-filter-min"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="dx-max" className="text-xs text-muted-foreground">
          {t("dasturxon.filters.maxGuests")}
        </Label>
        <Input
          id="dx-max"
          type="number"
          min={0}
          className="w-[130px]"
          value={range.max ?? ""}
          placeholder={t("dasturxon.filters.any")}
          onChange={(e) => onRange({ ...range, max: parse(e.target.value) })}
          data-testid="dx-filter-max"
        />
      </div>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onCity(null);
            onRange({ min: null, max: null });
          }}
          data-testid="dx-filter-clear"
        >
          {t("dasturxon.filters.clear")}
        </Button>
      )}
    </div>
  );
}
