import { useEffect } from "react";
import { Link, useLocation, useParams } from "wouter";
import { ArrowLeft, Share2 } from "lucide-react";

import {
  useGetCurrentUser,
  useGetBudgetPlan,
  getGetCurrentUserQueryKey,
  getGetBudgetPlanQueryKey,
} from "@workspace/api-client-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BudgetResults } from "@/components/budget/BudgetResults";
import { ShareLink } from "@/components/budget/ShareLink";
import { useBudgetI18n } from "@/components/budget/useBudgetI18n";

export default function PlanDetailPage() {
  const { t } = useBudgetI18n();
  const params = useParams();
  const [, setLocation] = useLocation();
  const id = Number(params.id);

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

  const {
    data: plan,
    isLoading,
    isError,
  } = useGetBudgetPlan(id, {
    query: {
      queryKey: getGetBudgetPlanQueryKey(id),
      enabled: !!user && !Number.isNaN(id),
      retry: false,
    },
  });

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <Button asChild variant="ghost" className="mb-6 -ml-2">
            <Link href="/my-plans">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("budget.plans.title")}
            </Link>
          </Button>

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
              <header className="mb-8">
                <h1 className="font-serif text-3xl font-bold text-foreground">
                  {plan.title || t("budget.plans.untitled")}
                </h1>
              </header>

              <Card className="mb-6">
                <CardContent className="space-y-3 p-6">
                  <div className="flex items-center gap-2 text-foreground">
                    <Share2 className="h-4 w-4 text-primary" />
                    <span className="font-semibold">
                      {t("budget.actions.share")}
                    </span>
                  </div>
                  <ShareLink token={plan.shareToken} />
                </CardContent>
              </Card>

              <BudgetResults plan={plan.plan} />
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
