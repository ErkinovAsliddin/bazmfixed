import { Star, Check, ImageOff } from "lucide-react";

import type { BudgetCategoryOptions, ComparisonTier } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, resolvePhotoSrc } from "@/lib/utils";
import { useBudgetI18n } from "./useBudgetI18n";

/**
 * One category section of the manual picker: a heading (with a Priority badge
 * for venue/catering), then comparison cards of verified vendor tiers. Exactly
 * one tier may be selected; selecting another replaces it, and re-selecting the
 * chosen tier deselects it. Empty categories show an honest "Coming soon".
 */
export function CategoryPicker({
  option,
  city,
  guestCount,
  selectedTierId,
  onSelect,
}: {
  option: BudgetCategoryOptions;
  city: string;
  guestCount: number;
  selectedTierId: number | null;
  onSelect: (tier: ComparisonTier | null) => void;
}) {
  const { t, fmt, num, categoryLabel, unitLabel, cityLabel } = useBudgetI18n();

  return (
    <section className="space-y-4" data-testid={`category-section-${option.category}`}>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-serif text-xl font-semibold text-foreground">
          {categoryLabel(option.category)}
        </h3>
        {option.isPriority && (
          <Badge className="bg-accent/15 text-accent-foreground" data-testid={`priority-badge-${option.category}`}>
            <Star className="mr-1 h-3 w-3 fill-accent text-accent" />
            {t("budget.priorityBadge")}
          </Badge>
        )}
      </div>

      {option.tiers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center text-muted-foreground">
            {t("budget.comingSoonCity", { city: cityLabel(city) })}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {option.tiers.map((tier) => {
            const selected = tier.tierId === selectedTierId;
            const cost = tier.estimatedCost ?? 0;
            return (
              <button
                type="button"
                key={tier.tierId}
                onClick={() => onSelect(selected ? null : tier)}
                aria-pressed={selected}
                data-testid={`tier-${option.category}-${tier.tierId}`}
                className={cn(
                  "group flex flex-col overflow-hidden rounded-xl border bg-card text-left transition-colors hover-elevate press",
                  selected
                    ? "border-primary ring-2 ring-primary/40"
                    : "border-card-border",
                )}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                  {tier.photos[0] ? (
                    <img
                      src={resolvePhotoSrc(tier.photos[0])}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <ImageOff className="h-8 w-8" />
                    </div>
                  )}
                  {selected && (
                    <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-1 p-4">
                  <p className="font-medium text-foreground">{tier.vendorName}</p>
                  <p className="text-sm text-muted-foreground">
                    {tier.vendorCity}
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {tier.tierName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {tier.unitType === "per_guest"
                      ? t("budget.results.perGuestNote", {
                          price: fmt(tier.pricePerUnit),
                          count: num(guestCount),
                        })
                      : `${fmt(tier.pricePerUnit)} · ${unitLabel(tier.unitType)}`}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                    <span className="font-semibold text-primary">{fmt(cost)}</span>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        selected ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {selected ? t("budget.selected") : t("budget.selectVendor")}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
