import { CheckCircle2, HelpCircle, Scale } from "lucide-react";
import type { SufficiencyStatus } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBudgetI18n } from "./useBudgetI18n";

/**
 * A calm sufficiency summary for a manual plan. Positive (within budget) is
 * emerald/calm, over budget is a gentle AMBER warning (never harsh red), and no
 * budget entered is neutral/unknown. Shows the difference when a budget is set.
 */
export function SufficiencyCheck({
  status,
  difference,
  estimatedTotal,
  totalBudget,
}: {
  status: SufficiencyStatus;
  difference?: number | null;
  estimatedTotal: number;
  totalBudget?: number | null;
}) {
  const { t, fmt } = useBudgetI18n();
  const diff = Math.abs(difference ?? 0);

  const tone =
    status === "sufficient"
      ? {
          ring: "border-primary/30 bg-primary/5",
          icon: <CheckCircle2 className="h-8 w-8 text-primary" />,
          title: t("budget.sufficiency.sufficientTitle"),
          body: t("budget.sufficiency.sufficientBody", { amount: fmt(diff) }),
          badgeLabel: t("budget.sufficiency.surplus"),
          badgeClass: "bg-primary/10 text-primary",
        }
      : status === "short"
        ? {
            ring: "border-accent/40 bg-accent/5",
            icon: <Scale className="h-8 w-8 text-accent" />,
            title: t("budget.overBudget"),
            body: t("budget.sufficiency.shortBody", { amount: fmt(diff) }),
            badgeLabel: t("budget.sufficiency.shortfall"),
            badgeClass: "bg-accent/15 text-accent-foreground",
          }
        : {
            ring: "border-border bg-muted/40",
            icon: <HelpCircle className="h-8 w-8 text-muted-foreground" />,
            title: t("budget.noBudgetSet"),
            body: t("budget.sufficiency.unknownBody", {
              amount: fmt(estimatedTotal),
            }),
            badgeLabel: null,
            badgeClass: "",
          };

  return (
    <Card className={`border-2 ${tone.ring}`} data-testid="sufficiency-check">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="shrink-0">{tone.icon}</div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-serif text-xl font-semibold text-foreground">
                {tone.title}
              </h3>
              {tone.badgeLabel && diff > 0 && (
                <Badge className={`${tone.badgeClass} font-semibold`}>
                  {tone.badgeLabel}: {fmt(diff)}
                </Badge>
              )}
            </div>
            <p className="mt-2 text-muted-foreground">{tone.body}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">
              {t("budget.results.estimatedTotal")}
            </span>
            <span className="font-semibold text-foreground">
              {fmt(estimatedTotal)}
            </span>
          </div>
          {totalBudget != null && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">
                {t("budget.results.yourBudget")}
              </span>
              <span className="font-semibold text-foreground">
                {fmt(totalBudget)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
