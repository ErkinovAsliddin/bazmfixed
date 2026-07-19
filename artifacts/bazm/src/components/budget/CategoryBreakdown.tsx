import { Star } from "lucide-react";
import type { ManualPlanView } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { resolvePhotoSrc } from "@/lib/utils";
import { useBudgetI18n } from "./useBudgetI18n";

/**
 * Renders the saved manual plan's chosen vendor per category, with photo,
 * tier, unit price, and estimated cost. Followed by the estimated total.
 */
export function CategoryBreakdown({ plan }: { plan: ManualPlanView }) {
  const { t, fmt, num, categoryLabel, unitLabel } = useBudgetI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-xl">
          {t("budget.results.breakdown")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {plan.items.map((item) => (
            <li
              key={`${item.category}-${item.tierId}`}
              className="flex items-start gap-4 py-4 first:pt-0 last:pb-0"
              data-testid={`breakdown-item-${item.category}`}
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                {item.photos[0] ? (
                  <img
                    src={resolvePhotoSrc(item.photos[0])}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">
                    {categoryLabel(item.category)}
                  </span>
                  {item.isPriority && (
                    <Badge className="bg-accent/15 text-accent-foreground">
                      <Star className="mr-1 h-3 w-3 fill-accent text-accent" />
                      {t("budget.priorityBadge")}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {item.vendorName}
                  <span className="text-muted-foreground">
                    {" · "}
                    {item.city}
                  </span>
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {item.tierName}
                  {" · "}
                  {item.unitType === "per_guest"
                    ? t("budget.results.perGuestNote", {
                        price: fmt(item.pricePerUnit),
                        count: num(plan.guestCount),
                      })
                    : `${fmt(item.pricePerUnit)} · ${unitLabel(item.unitType)}`}
                </p>
              </div>
              <span className="shrink-0 whitespace-nowrap font-semibold text-foreground">
                {fmt(item.estimatedCost)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <span className="font-serif text-lg font-semibold text-foreground">
            {t("budget.results.estimatedTotal")}
          </span>
          <span className="font-serif text-lg font-bold text-primary">
            {fmt(plan.estimatedTotal)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
