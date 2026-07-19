import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Users, Wallet, ArrowRight, PlusCircle } from "lucide-react";

import {
  useGetCurrentUser,
  useListBudgetPlans,
  getGetCurrentUserQueryKey,
  getListBudgetPlansQueryKey,
  type SufficiencyStatus,
} from "@workspace/api-client-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { useBudgetI18n } from "@/components/budget/useBudgetI18n";

const STATUS_STYLE: Record<SufficiencyStatus, string> = {
  sufficient: "bg-primary/10 text-primary",
  short: "bg-accent/15 text-accent-foreground",
  unknown: "bg-muted text-muted-foreground",
};

export default function MyPlansPage() {
  const { t, fmt, num, cityLabel, locale } = useBudgetI18n();
  const [, setLocation] = useLocation();

  const {
    data: user,
    isError: authError,
    isLoading: authLoading,
  } = useGetCurrentUser({
    query: { queryKey: getGetCurrentUserQueryKey(), retry: false },
  });

  useEffect(() => {
    if (!authLoading && authError) setLocation("/login");
  }, [authError, authLoading, setLocation]);

  const { data: plans, isLoading } = useListBudgetPlans({
    query: {
      queryKey: getListBudgetPlansQueryKey(),
      enabled: !!user,
      retry: false,
    },
  });

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground">
                {t("budget.plans.title")}
              </h1>
              <p className="mt-1 text-muted-foreground">
                {t("budget.plans.subtitle")}
              </p>
            </div>
            <Button asChild>
              <Link href="/budget">
                <PlusCircle className="mr-2 h-4 w-4" />
                {t("budget.plans.createFirst")}
              </Link>
            </Button>
          </div>

          {isLoading && (
            <div className="flex justify-center py-16">
              <div className="h-10 w-10 animate-pulse rounded-full bg-primary/20" />
            </div>
          )}

          {!isLoading && plans && plans.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-2">
                <EmptyState
                  icon={Wallet}
                  title={t("budget.plans.empty")}
                  description={t("empty.plansDesc")}
                  action={
                    <Button asChild className="press">
                      <Link href="/budget">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {t("budget.plans.createFirst")}
                      </Link>
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          )}

          {!isLoading && plans && plans.length > 0 && (
            <ul className="space-y-4">
              {plans.map((plan) => (
                <li key={plan.id}>
                  <Link href={`/plans/${plan.id}`}>
                    <Card className="cursor-pointer transition-colors hover:border-primary/40">
                      <CardContent className="flex items-center justify-between gap-4 p-5">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate font-serif text-lg font-semibold text-foreground">
                              {plan.title || t("budget.plans.untitled")}
                            </h3>
                            <Badge className={STATUS_STYLE[plan.status]}>
                              {t(`budget.sufficiency.${plan.status}Title`)}
                            </Badge>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {t("budget.scenarios.guests", {
                                count: num(plan.guestCount),
                              })}
                            </span>
                            <span>{cityLabel(plan.city)}</span>
                            <span className="inline-flex items-center gap-1">
                              <Wallet className="h-3.5 w-3.5" />
                              {fmt(plan.estimatedTotal)}
                            </span>
                            <span>
                              {new Date(plan.createdAt).toLocaleDateString(locale)}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
