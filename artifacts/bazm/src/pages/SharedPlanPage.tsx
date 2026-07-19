import { useParams } from "wouter";
import { Heart } from "lucide-react";

import {
  useGetSharedBudgetPlan,
  getGetSharedBudgetPlanQueryKey,
} from "@workspace/api-client-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { BudgetResults } from "@/components/budget/BudgetResults";
import { useBudgetI18n } from "@/components/budget/useBudgetI18n";

export default function SharedPlanPage() {
  const { t, num, cityLabel } = useBudgetI18n();
  const params = useParams();
  const token = params.token ?? "";

  const {
    data: plan,
    isLoading,
    isError,
  } = useGetSharedBudgetPlan(token, {
    query: {
      queryKey: getGetSharedBudgetPlanQueryKey(token),
      enabled: !!token,
      retry: false,
    },
  });

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 py-12">
        <div className="mx-auto max-w-3xl">
          {isLoading && (
            <div className="flex justify-center py-16">
              <div className="h-10 w-10 animate-pulse rounded-full bg-primary/20" />
            </div>
          )}

          {isError && !isLoading && (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center text-muted-foreground">
                {t("budget.share.notFound")}
              </CardContent>
            </Card>
          )}

          {plan && (
            <>
              <header className="mb-10 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/40">
                  <Heart className="h-7 w-7 text-primary" />
                </div>
                {plan.title && (
                  <p className="mb-1 text-sm font-medium uppercase tracking-wide text-accent-foreground">
                    {plan.title}
                  </p>
                )}
                <h1 className="font-serif text-4xl font-bold text-foreground">
                  {t("budget.share.heading")}
                </h1>
                <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                  {t("budget.share.intro")}
                </p>
                <p className="mt-4 text-sm font-medium text-foreground">
                  {t("budget.share.meta", {
                    count: num(plan.plan.guestCount),
                    city: cityLabel(plan.plan.city),
                  })}
                </p>
              </header>

              <BudgetResults plan={plan.plan} />

              <p className="mt-10 text-center text-sm text-muted-foreground">
                {t("budget.share.footer")}
              </p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
