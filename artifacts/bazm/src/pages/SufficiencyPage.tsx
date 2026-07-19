import { useEffect, useRef, useState } from "react";
import { useSearch } from "wouter";
import { ShieldCheck } from "lucide-react";
import {
  useCalculateSufficiency,
  type SufficiencyCategory,
} from "@workspace/api-client-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SUFFICIENCY_CATEGORIES, useSufficiencyI18n } from "@/components/sufficiency/useSufficiencyI18n";
import {
  SufficiencyForm,
  type SufficiencyFormState,
} from "@/components/sufficiency/SufficiencyForm";
import { SufficiencyResults } from "@/components/sufficiency/SufficiencyResults";

const ALL_CATEGORIES = SUFFICIENCY_CATEGORIES.map(
  (c) => c.key,
) as SufficiencyCategory[];

export default function SufficiencyPage() {
  const { t } = useSufficiencyI18n();
  const search = useSearch();

  // Guest count is carried over from the budget planner via ?guests=.
  const guestsParam = Number(new URLSearchParams(search).get("guests"));
  const initialGuests =
    Number.isFinite(guestsParam) && guestsParam >= 1
      ? Math.min(5000, Math.floor(guestsParam))
      : 150;

  const [state, setState] = useState<SufficiencyFormState>({
    guestCount: initialGuests,
    durationHours: 4,
    categories: ALL_CATEGORIES,
  });

  const calc = useCalculateSufficiency();
  const submit = () => {
    if (
      state.guestCount < 1 ||
      state.durationHours < 1 ||
      state.categories.length === 0
    )
      return;
    calc.mutate({
      data: {
        guestCount: state.guestCount,
        durationHours: state.durationHours,
        categories: state.categories,
      },
    });
  };

  // Auto-calculate once on arrival so the page is never empty.
  const didAutoRun = useRef(false);
  useEffect(() => {
    if (didAutoRun.current) return;
    didAutoRun.current = true;
    submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 py-12">
        <header className="mb-8 max-w-2xl">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <ShieldCheck className="h-4 w-4" />
            {t("sufficiency.eyebrow")}
          </div>
          <h1 className="mt-2 font-serif text-4xl font-bold text-foreground">
            {t("sufficiency.title")}
          </h1>
          <p className="mt-3 text-muted-foreground">{t("sufficiency.subtitle")}</p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
          <div className="lg:sticky lg:top-20 lg:self-start">
            <SufficiencyForm
              state={state}
              onChange={setState}
              onSubmit={submit}
              loading={calc.isPending}
            />
          </div>

          <div>
            {calc.isPending && (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-24 animate-pulse rounded-xl bg-muted/50"
                  />
                ))}
              </div>
            )}
            {calc.isError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-muted-foreground">
                {t("sufficiency.results.error")}
              </div>
            )}
            {calc.data && !calc.isPending && (
              <SufficiencyResults result={calc.data} />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
