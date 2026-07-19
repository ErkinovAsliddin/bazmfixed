import { Link } from "wouter";
import { ShieldCheck, ShoppingCart, Check, Store } from "lucide-react";
import type {
  SufficiencyResult,
  SufficiencyCategoryResult,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/lib/cart";
import { SUFFICIENCY_CATEGORIES, useSufficiencyI18n } from "./useSufficiencyI18n";

const ICON_BY_KEY = Object.fromEntries(
  SUFFICIENCY_CATEGORIES.map((c) => [c.key, c.icon]),
);

function CategoryRow({ row }: { row: SufficiencyCategoryResult }) {
  const { t, fmt, amountLabel, categoryLabel, categoryNote } =
    useSufficiencyI18n();
  const { setItem } = useCart();
  const { toast } = useToast();
  const Icon = ICON_BY_KEY[row.category];

  const buyRecommended = () => {
    if (!row.product) return;
    setItem(row.product.productId, row.product.recommendedQuantity);
    toast({
      title: t("sufficiency.results.addedTitle"),
      description: t("sufficiency.results.addedBody", {
        quantity: row.product.recommendedQuantity,
        name: row.product.name,
      }),
    });
  };

  return (
    <Card data-testid={`result-${row.category}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
            )}
            <div>
              <h3 className="font-serif text-lg font-semibold text-foreground">
                {categoryLabel(row.category)}
              </h3>
              {row.durationSensitive && (
                <Badge variant="outline" className="mt-1 text-xs">
                  {t("sufficiency.results.durationBadge")}
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <div
              className="font-serif text-2xl font-bold text-primary"
              data-testid={`amount-${row.category}`}
            >
              {amountLabel(row.recommendedAmount, row.unit)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("sufficiency.results.rangeNote", {
                strict: amountLabel(row.strictAmount, row.unit),
              })}
            </p>
          </div>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          {categoryNote(row.category)}
        </p>

        {row.product && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent/30 bg-accent/5 p-3">
            <div className="flex items-center gap-2 text-sm">
              <Store className="h-4 w-4 shrink-0 text-accent-foreground" />
              <span className="text-foreground">
                {t("sufficiency.results.buyLine", {
                  name: row.product.name,
                  total: fmt(row.product.totalPrice),
                })}
              </span>
            </div>
            <Button
              size="sm"
              onClick={buyRecommended}
              disabled={!row.product.inStock}
              data-testid={`buy-${row.category}`}
            >
              {row.product.inStock ? (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {t("sufficiency.results.buyButton")}
                </>
              ) : (
                t("sufficiency.results.outOfStock")
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SufficiencyResults({ result }: { result: SufficiencyResult }) {
  const { t } = useSufficiencyI18n();
  const bufferPct = Math.round(result.bufferPercent * 100);

  return (
    <div className="space-y-4">
      {/* Buffer explanation — directly addresses "what if we run out?" */}
      <div
        className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4"
        data-testid="buffer-note"
      >
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="font-medium text-foreground">
            {t("sufficiency.results.bufferTitle", { percent: bufferPct })}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("sufficiency.results.bufferBody")}
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {result.categories.map((row) => (
          <CategoryRow key={row.category} row={row} />
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 pt-2 text-sm text-muted-foreground">
        <Check className="h-4 w-4 text-primary" />
        {t("sufficiency.results.footerNote")}
        <Link
          href="/marketplace"
          className="font-medium text-primary hover:underline"
        >
          {t("sufficiency.results.viewCart")}
        </Link>
      </div>
    </div>
  );
}
