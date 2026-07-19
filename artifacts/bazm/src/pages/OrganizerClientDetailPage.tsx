import { useEffect } from "react";
import { Link, useLocation, useParams } from "wouter";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Circle,
  MapPin,
  Users,
  StickyNote,
} from "lucide-react";
import {
  useGetCurrentUser,
  useGetOrganizerClient,
  getGetCurrentUserQueryKey,
  getGetOrganizerClientQueryKey,
  type OrganizerClientDetail,
} from "@workspace/api-client-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrganizerI18n } from "@/components/organizer/useOrganizerI18n";

function PlanSummaryCard({ client }: { client: OrganizerClientDetail }) {
  const { t, fmt, cityLabel } = useOrganizerI18n();
  const plan = client.plan;
  if (!plan) return null;

  const decided = client.chosenTiers.length;
  const pending = client.pendingCategories.length;
  const total = decided + pending;
  const progress = total > 0 ? Math.round((decided / total) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-xl">
          {t("organizer.detail.planTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">
                {t("organizer.detail.city")}
              </div>
              <div className="font-medium">{cityLabel(plan.city)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">
                {t("organizer.detail.guests")}
              </div>
              <div className="font-medium">{plan.guestCount}</div>
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">
              {t("organizer.detail.estimatedTotal")}
            </div>
            <div className="font-medium">{fmt(plan.estimatedTotal)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">
              {t("organizer.detail.undecidedTotal")}
            </div>
            <div
              className={
                plan.undecidedTotal > 0
                  ? "font-medium text-amber-600 dark:text-amber-500"
                  : "font-medium text-muted-foreground"
              }
            >
              {fmt(plan.undecidedTotal)}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t("organizer.detail.progress")}
            </span>
            <span className="font-medium">
              {t("organizer.detail.decidedOf", {
                decided,
                total,
              })}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChosenTiersCard({ client }: { client: OrganizerClientDetail }) {
  const { t, fmt, categoryLabel, tierLabel } = useOrganizerI18n();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-xl">
          {t("organizer.detail.chosenTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {client.chosenTiers.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            {t("organizer.detail.noChosen")}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {client.chosenTiers.map((tier) => (
              <li
                key={tier.category}
                className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                data-testid={`chosen-${tier.category}`}
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-500" />
                  <div>
                    <div className="font-medium text-foreground">
                      {categoryLabel(tier.category)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {tier.vendorName ??
                        t("organizer.detail.vendorUnknown")}
                      {tier.tierName && ` · ${tierLabel(tier.tierName)}`}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-right font-medium">
                  {fmt(tier.estimatedCost)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function PendingCard({ client }: { client: OrganizerClientDetail }) {
  const { t, fmt, categoryLabel } = useOrganizerI18n();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-xl">
          {t("organizer.detail.pendingTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {client.pendingCategories.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            {t("organizer.detail.noPending")}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {client.pendingCategories.map((cat) => (
              <li
                key={cat.category}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                data-testid={`pending-${cat.category}`}
              >
                <div className="flex items-center gap-3">
                  <Circle className="h-5 w-5 shrink-0 text-amber-500" />
                  <span className="font-medium text-foreground">
                    {categoryLabel(cat.category)}
                  </span>
                </div>
                <div className="shrink-0 text-right text-sm text-muted-foreground">
                  {t("organizer.detail.estimate")}: {fmt(cat.estimatedCost)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default function OrganizerClientDetailPage() {
  const { t, formatDate, statusLabel } = useOrganizerI18n();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const clientId = Number(params.id);

  const {
    data: user,
    isLoading: authLoading,
    isError: authError,
  } = useGetCurrentUser({
    query: { queryKey: getGetCurrentUserQueryKey(), retry: false },
  });

  useEffect(() => {
    if (!authLoading && authError) setLocation("/login");
  }, [authError, authLoading, setLocation]);

  const isOrganizer = user?.role === "organizer";

  const {
    data: client,
    isLoading,
    isError,
  } = useGetOrganizerClient(clientId, {
    query: {
      queryKey: getGetOrganizerClientQueryKey(clientId),
      enabled: isOrganizer && Number.isFinite(clientId),
      retry: false,
    },
  });

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <Button
            variant="ghost"
            size="sm"
            className="mb-6 -ml-2"
            onClick={() => setLocation("/organizer-dashboard")}
            data-testid="back-button"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("organizer.detail.back")}
          </Button>

          {isOrganizer && isLoading && (
            <div className="h-64 animate-pulse rounded-xl bg-muted/50" />
          )}

          {isOrganizer && isError && (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center text-muted-foreground">
                {t("organizer.detail.notFound")}
              </CardContent>
            </Card>
          )}

          {user && !isOrganizer && (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center text-muted-foreground">
                {t("organizer.notOrganizer")}
              </CardContent>
            </Card>
          )}

          {isOrganizer && client && (
            <div className="space-y-6">
              <header>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-serif text-3xl font-bold text-foreground">
                    {client.clientName}
                  </h1>
                  {client.linked ? (
                    <Badge variant="secondary">{t("organizer.linked")}</Badge>
                  ) : (
                    <Badge variant="outline">{t("organizer.manual")}</Badge>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarClock className="h-4 w-4" />
                    {formatDate(client.weddingDate)}
                    {typeof client.daysUntilWedding === "number" &&
                      client.daysUntilWedding >= 0 &&
                      ` · ${t("organizer.inDays", {
                        count: client.daysUntilWedding,
                      })}`}
                  </span>
                  <span>{statusLabel(client.status)}</span>
                </div>
                {client.notes && (
                  <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                    <StickyNote className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{client.notes}</span>
                  </div>
                )}
              </header>

              {client.plan ? (
                <>
                  <PlanSummaryCard client={client} />
                  <div className="grid gap-6 md:grid-cols-2">
                    <ChosenTiersCard client={client} />
                    <PendingCard client={client} />
                  </div>
                </>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="p-12 text-center text-muted-foreground">
                    {client.linked
                      ? t("organizer.detail.noPlanLinked")
                      : t("organizer.detail.noPlanManual")}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
