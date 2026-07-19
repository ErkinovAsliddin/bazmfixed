import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearch } from "wouter";
import { ArrowLeft, Store, Wallet } from "lucide-react";
import {
  useGetCategoryComparison,
  getGetCategoryComparisonQueryKey,
  type VendorCategory,
} from "@workspace/api-client-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { CategoryComparisonTable } from "@/components/vendors/CategoryComparisonTable";
import { VENDOR_CATEGORIES } from "@/components/vendors/VendorFilters";
import { useVendorI18n } from "@/components/vendors/useVendorI18n";

function isVendorCategory(value: string): value is VendorCategory {
  return (VENDOR_CATEGORIES as readonly string[]).includes(value);
}

/** The comparable cost of a row: guest-based estimate if present, else unit price. */
function rowCost(estimatedCost: number | null | undefined, pricePerUnit: number) {
  return estimatedCost ?? pricePerUnit;
}

export default function CategoryComparisonPage() {
  const { t, fmt, categoryLabel } = useVendorI18n();
  const params = useParams();
  const search = useSearch();
  const category = params.category ?? "";

  const query = new URLSearchParams(search);
  const guestCountRaw = Number(query.get("guestCount"));
  const guestCount =
    Number.isFinite(guestCountRaw) && guestCountRaw >= 1
      ? Math.floor(guestCountRaw)
      : null;
  const maxCostRaw = Number(query.get("maxCost"));
  const maxCost =
    Number.isFinite(maxCostRaw) && maxCostRaw > 0 ? Math.floor(maxCostRaw) : null;
  const cityParam = query.get("city");

  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [onlyFits, setOnlyFits] = useState(maxCost !== null);

  // Re-sync the budget filter whenever the deep-link params change — this
  // component instance is reused across in-app navigation between comparisons.
  useEffect(() => {
    setOnlyFits(maxCost !== null);
  }, [search, maxCost]);

  const valid = isVendorCategory(category);
  const hasFilters = maxCost !== null || cityParam !== null;
  const requestParams = {
    ...(guestCount !== null ? { guestCount } : {}),
    ...(cityParam ? { city: cityParam } : {}),
  };

  const { data, isLoading } = useGetCategoryComparison(
    category as VendorCategory,
    requestParams,
    {
      query: {
        queryKey: getGetCategoryComparisonQueryKey(
          category as VendorCategory,
          requestParams,
        ),
        enabled: valid,
        retry: false,
      },
    },
  );

  const rows = useMemo(() => {
    let list = data?.tiers ?? [];
    if (onlyFits && maxCost !== null) {
      list = list.filter(
        (r) => rowCost(r.estimatedCost, r.pricePerUnit) <= maxCost,
      );
    }
    return [...list].sort((a, b) => {
      const diff =
        rowCost(a.estimatedCost, a.pricePerUnit) -
        rowCost(b.estimatedCost, b.pricePerUnit);
      return sortDir === "asc" ? diff : -diff;
    });
  }, [data, onlyFits, maxCost, sortDir]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 py-12">
        <Button asChild variant="ghost" className="mb-6 -ml-2">
          <Link href="/vendors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("vendors.comparison.backToVendors")}
          </Link>
        </Button>

        <header className="mb-6">
          <h1 className="font-serif text-4xl font-bold text-foreground">
            {valid
              ? t("vendors.comparison.title", { category: categoryLabel(category) })
              : t("vendors.detail.notFound")}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t("vendors.comparison.subtitle")}
          </p>
        </header>

        {maxCost !== null && (
          <div
            className="mb-6 flex items-start gap-3 rounded-lg border border-accent/40 bg-accent/10 p-4"
            data-testid="budget-banner"
          >
            <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-accent-foreground" />
            <div className="text-sm">
              <p className="font-medium text-foreground">
                {t("vendors.comparison.budgetNote", { amount: fmt(maxCost) })}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Switch
                  id="only-fits"
                  checked={onlyFits}
                  onCheckedChange={setOnlyFits}
                  data-testid="only-fits-toggle"
                />
                <Label htmlFor="only-fits" className="cursor-pointer">
                  {t("vendors.comparison.onlyFits")}
                </Label>
              </div>
            </div>
          </div>
        )}

        {valid && (
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {t("vendors.comparison.resultCount", { count: rows.length })}
            </p>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">
                {t("vendors.comparison.sortBy")}
              </Label>
              <Select
                value={sortDir}
                onValueChange={(v) => setSortDir(v as "asc" | "desc")}
              >
                <SelectTrigger className="w-[180px]" data-testid="sort-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">
                    {t("vendors.comparison.priceLowHigh")}
                  </SelectItem>
                  <SelectItem value="desc">
                    {t("vendors.comparison.priceHighLow")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="h-64 animate-pulse rounded-xl bg-muted/50" />
        )}

        {!isLoading && valid && (data?.tiers?.length ?? 0) === 0 && !hasFilters ? (
          <div className="rounded-lg border border-dashed border-border">
            <EmptyState
              data-testid="comparison-no-vendors"
              icon={Store}
              title={t("vendors.noVendors")}
              description={t("vendors.comingSoon")}
              action={
                <Button asChild variant="outline" className="press">
                  <Link href="/vendors">
                    {t("vendors.comparison.backToVendors")}
                  </Link>
                </Button>
              }
            />
          </div>
        ) : (
          !isLoading &&
          valid && (
            <CategoryComparisonTable
              rows={rows}
              showEstimated={guestCount !== null}
            />
          )
        )}
      </main>
      <Footer />
    </div>
  );
}
