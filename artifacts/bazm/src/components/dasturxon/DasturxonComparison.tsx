import { Link } from "wouter";
import { Scale, ArrowRight, Sparkles } from "lucide-react";
import {
  useGetDasturxonComparison,
  getGetDasturxonComparisonQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDasturxonI18n } from "./useDasturxonI18n";

/**
 * "Your planned dasturxon vs. similar weddings." Only rendered for signed-in
 * users; falls back to a gentle prompt when there's no plan yet.
 */
export function DasturxonComparison() {
  const { t, fmt, num, dishLabel } = useDasturxonI18n();
  const { data, isLoading } = useGetDasturxonComparison({
    query: { queryKey: getGetDasturxonComparisonQueryKey(), retry: false },
  });

  if (isLoading || !data) return null;

  const heading = (
    <div className="mb-4 flex items-center gap-2">
      <Scale className="h-5 w-5 text-primary" />
      <h2 className="font-serif text-2xl font-bold text-foreground">
        {t("dasturxon.compare.title")}
      </h2>
    </div>
  );

  // No active budget plan — nudge them to make one.
  if (!data.hasPlan || !data.plan) {
    return (
      <section data-testid="dasturxon-comparison-noplan">
        {heading}
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground">{t("dasturxon.compare.noPlan")}</p>
            <Button asChild>
              <Link href="/budget">
                {t("dasturxon.compare.planCta")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  const { plan, similar } = data;
  const noSimilar = !similar || similar.entryCount === 0;

  // Per-guest gap between the couple's plan and the local average.
  let verdict: string | null = null;
  if (
    !noSimilar &&
    similar &&
    plan.plannedPerGuest !== null &&
    plan.plannedPerGuest !== undefined
  ) {
    const diff = plan.plannedPerGuest - similar.avgPerGuest;
    const pct =
      similar.avgPerGuest > 0
        ? Math.round((Math.abs(diff) / similar.avgPerGuest) * 100)
        : 0;
    if (pct < 8) {
      verdict = t("dasturxon.compare.inLine");
    } else if (diff > 0) {
      verdict = t("dasturxon.compare.above", { amount: fmt(diff), pct });
    } else {
      verdict = t("dasturxon.compare.below", { amount: fmt(-diff), pct });
    }
  }

  return (
    <section data-testid="dasturxon-comparison">
      {heading}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Your plan */}
            <div className="rounded-xl border border-primary/25 bg-primary/5 p-5">
              <p className="text-sm font-medium text-primary">
                {t("dasturxon.compare.yours")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("dasturxon.card.headline", {
                  city: t(`budget.cities.${plan.city}`, { defaultValue: plan.city }),
                  count: num(plan.guestCount),
                })}
              </p>
              <div className="mt-4">
                <p className="font-serif text-2xl font-bold text-foreground">
                  {plan.plannedPerGuest !== null && plan.plannedPerGuest !== undefined
                    ? fmt(plan.plannedPerGuest)
                    : "—"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("dasturxon.card.perGuest")}
                </p>
              </div>
              {plan.plannedFoodSpend !== null &&
                plan.plannedFoodSpend !== undefined && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("dasturxon.card.totalSpend")}:{" "}
                    <span className="font-medium text-foreground">
                      {fmt(plan.plannedFoodSpend)}
                    </span>
                  </p>
                )}
              {plan.plannedMenu && (
                <p className="mt-3 text-sm italic text-muted-foreground">
                  “{plan.plannedMenu}”
                </p>
              )}
            </div>

            {/* Similar weddings */}
            <div className="rounded-xl border border-border bg-muted/30 p-5">
              <p className="text-sm font-medium text-foreground">
                {t("dasturxon.compare.similar")}
              </p>
              {noSimilar ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  {t("dasturxon.compare.noSimilar")}
                </p>
              ) : (
                similar && (
                  <>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("dasturxon.compare.range", {
                        min: num(similar.guestMin),
                        max: num(similar.guestMax),
                        count: similar.entryCount,
                      })}
                    </p>
                    <div className="mt-4">
                      <p className="font-serif text-2xl font-bold text-foreground">
                        {fmt(similar.avgPerGuest)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("dasturxon.compare.avgPerGuest")}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t("dasturxon.card.totalSpend")}:{" "}
                      <span className="font-medium text-foreground">
                        {fmt(similar.avgFoodSpend)}
                      </span>
                    </p>
                  </>
                )
              )}
            </div>
          </div>

          {verdict && (
            <div className="mt-5 flex items-start gap-2 rounded-lg bg-accent/10 p-4 text-sm">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent-foreground" />
              <p className="text-foreground">{verdict}</p>
            </div>
          )}

          {!noSimilar && similar && similar.commonItems.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-medium text-foreground">
                {t("dasturxon.compare.commonItems")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {similar.commonItems.map((item) => (
                  <Badge key={item.itemName} variant="secondary" className="font-normal">
                    {dishLabel(item.itemName)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
