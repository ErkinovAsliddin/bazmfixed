import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Sparkles, LogIn, CheckCircle2, FileText, Save } from "lucide-react";

import {
  useGetBudgetOptions,
  getGetBudgetOptionsQueryKey,
  useCreateBudgetPlan,
  useGetCurrentUser,
  getGetCurrentUserQueryKey,
  type CityOption,
  type ComparisonTier,
  type SufficiencyStatus,
  type SavedBudgetPlan,
  type BudgetSelectionInput,
} from "@workspace/api-client-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { BudgetForm } from "@/components/budget/BudgetForm";
import { CategoryPicker } from "@/components/budget/CategoryPicker";
import { ShareLink } from "@/components/budget/ShareLink";
import { useBudgetI18n } from "@/components/budget/useBudgetI18n";

const CATEGORY_ORDER = [
  "venue",
  "catering",
  "decor",
  "music",
  "photography",
  "clothing",
] as const;

type Selection = {
  tier: ComparisonTier;
  category: (typeof CATEGORY_ORDER)[number];
};

export default function BudgetPlannerPage() {
  const { t, fmt } = useBudgetI18n();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [city, setCity] = useState<CityOption | "">("");
  const [guestCountStr, setGuestCountStr] = useState("");
  const [totalBudgetStr, setTotalBudgetStr] = useState("");
  const [title, setTitle] = useState("");
  const [savedPlan, setSavedPlan] = useState<SavedBudgetPlan | null>(null);
  // Selections keyed by category → chosen tier.
  const [selections, setSelections] = useState<Record<string, ComparisonTier>>(
    {},
  );

  const guestCount = Number(guestCountStr);
  const totalBudget =
    totalBudgetStr.trim() === "" || Number.isNaN(Number(totalBudgetStr))
      ? null
      : Math.max(0, Math.floor(Number(totalBudgetStr)));

  const { data: user } = useGetCurrentUser({
    query: { queryKey: getGetCurrentUserQueryKey(), retry: false },
  });

  const enabled = !!city && guestCount > 0;
  const optionsParams = { city: (city || "Tashkent") as CityOption, guestCount };
  const { data: options, isLoading } = useGetBudgetOptions(optionsParams, {
    query: {
      enabled,
      queryKey: getGetBudgetOptionsQueryKey(optionsParams),
    },
  });

  const createMutation = useCreateBudgetPlan();

  // Order the returned categories by the canonical order.
  const orderedOptions = useMemo(() => {
    if (!options) return [];
    return [...options].sort(
      (a, b) =>
        CATEGORY_ORDER.indexOf(a.category as (typeof CATEGORY_ORDER)[number]) -
        CATEGORY_ORDER.indexOf(b.category as (typeof CATEGORY_ORDER)[number]),
    );
  }, [options]);

  const chosen = useMemo<Selection[]>(
    () =>
      Object.entries(selections).map(([category, tier]) => ({
        category: category as (typeof CATEGORY_ORDER)[number],
        tier,
      })),
    [selections],
  );

  const estimatedTotal = chosen.reduce(
    (sum, s) => sum + (s.tier.estimatedCost ?? 0),
    0,
  );

  const status: SufficiencyStatus =
    totalBudget == null
      ? "unknown"
      : estimatedTotal <= totalBudget
        ? "sufficient"
        : "short";
  const difference = totalBudget == null ? null : totalBudget - estimatedTotal;

  const handleSelect = (
    category: string,
    tier: ComparisonTier | null,
  ) => {
    setSavedPlan(null);
    setSelections((prev) => {
      const next = { ...prev };
      if (tier == null) delete next[category];
      else next[category] = tier;
      return next;
    });
  };

  const onSave = () => {
    if (!user) {
      setLocation("/login");
      return;
    }
    if (chosen.length === 0) {
      toast({ title: t("budget.selectAtLeastOne"), variant: "destructive" });
      return;
    }
    const selectionsInput: BudgetSelectionInput[] = chosen.map((s) => ({
      category: s.category,
      vendorTierId: s.tier.tierId,
    }));
    createMutation.mutate(
      {
        data: {
          title: title.trim() || undefined,
          city: city as CityOption,
          guestCount,
          totalBudget,
          selections: selectionsInput,
        },
      },
      {
        onSuccess: (plan) => {
          setSavedPlan(plan);
          window.scrollTo({ top: 0, behavior: "smooth" });
        },
        onError: () =>
          toast({ title: t("budget.saveError"), variant: "destructive" }),
      },
    );
  };

  const toneClass =
    status === "sufficient"
      ? "text-primary"
      : status === "short"
        ? "text-accent-foreground"
        : "text-muted-foreground";

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 py-12 pb-28">
        <div className="mx-auto max-w-5xl">
          <header className="mb-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <h1 className="font-serif text-4xl font-bold text-foreground">
              {t("budget.title")}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              {t("budget.pickerSubtitle")}
            </p>
          </header>

          {savedPlan && (
            <Card className="mb-8 border-primary/30 bg-primary/5">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">
                    {t("budget.actions.saved")}
                  </span>
                </div>
                <ShareLink token={savedPlan.shareToken} />
                <div className="flex flex-wrap gap-3 pt-1">
                  <Button asChild variant="outline">
                    <Link href={`/plans/${savedPlan.id}`}>
                      <FileText className="mr-2 h-4 w-4" />
                      {t("budget.plans.open")}
                    </Link>
                  </Button>
                  <Button asChild variant="ghost">
                    <Link href="/my-plans">{t("budget.plans.title")}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="mb-8">
            <CardContent className="p-6 sm:p-8">
              <h2 className="mb-6 font-serif text-xl font-semibold text-foreground">
                {t("budget.form.heading")}
              </h2>
              <BudgetForm
                city={city}
                onCityChange={setCity}
                guestCount={guestCountStr}
                onGuestCountChange={setGuestCountStr}
                totalBudget={totalBudgetStr}
                onTotalBudgetChange={setTotalBudgetStr}
              />
            </CardContent>
          </Card>

          {!enabled && (
            <Card className="border-dashed">
              <CardContent className="p-10 text-center text-muted-foreground">
                {t("budget.pickerPrompt")}
              </CardContent>
            </Card>
          )}

          {enabled && isLoading && (
            <div className="flex justify-center py-16">
              <div className="h-10 w-10 animate-pulse rounded-full bg-primary/20" />
            </div>
          )}

          {enabled && !isLoading && orderedOptions.length > 0 && (
            <div className="space-y-10">
              {orderedOptions.map((option) => (
                <CategoryPicker
                  key={option.category}
                  option={option}
                  city={city as string}
                  guestCount={guestCount}
                  selectedTierId={selections[option.category]?.tierId ?? null}
                  onSelect={(tier) => handleSelect(option.category, tier)}
                />
              ))}

              <Card>
                <CardContent className="space-y-3 p-6">
                  <label className="text-sm font-medium text-foreground">
                    {t("budget.titleField.label")}
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t("budget.titleField.placeholder")}
                    className="bg-background"
                    data-testid="input-plan-title"
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {enabled && orderedOptions.length > 0 && (
        <div className="sticky bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-4">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">
                {t("budget.runningTotal")}
              </p>
              <div className="flex flex-wrap items-baseline gap-2">
                <span
                  className="font-serif text-2xl font-bold text-foreground"
                  data-testid="text-running-total"
                >
                  {fmt(estimatedTotal)}
                </span>
                {totalBudget != null && (
                  <span className="text-sm text-muted-foreground">
                    {t("budget.ofBudget", { budget: fmt(totalBudget) })}
                  </span>
                )}
              </div>
              <p className={cn("mt-0.5 text-sm font-medium", toneClass)} data-testid="text-sufficiency">
                {status === "unknown"
                  ? t("budget.noBudgetSet")
                  : status === "sufficient"
                    ? t("budget.withinBudget", {
                        amount: fmt(Math.abs(difference ?? 0)),
                      })
                    : t("budget.overBudget")}
                {status !== "unknown" && difference != null && (
                  <span className="ml-1 text-muted-foreground">
                    {t("budget.difference", { amount: fmt(Math.abs(difference)) })}
                  </span>
                )}
              </p>
            </div>
            <Button
              size="lg"
              onClick={onSave}
              disabled={createMutation.isPending}
              className="shrink-0"
              data-testid="button-save-plan"
            >
              {user ? (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {createMutation.isPending
                    ? t("budget.actions.saving")
                    : t("budget.savePlan")}
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  {t("budget.actions.signInToSave")}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
