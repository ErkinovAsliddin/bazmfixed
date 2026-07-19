import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { CalendarClock, Users, AlertTriangle, ChevronRight } from "lucide-react";
import {
  useGetCurrentUser,
  useListOrganizerClients,
  useGetOrganizerSummary,
  getGetCurrentUserQueryKey,
  getListOrganizerClientsQueryKey,
  getGetOrganizerSummaryQueryKey,
  type OrganizerClientSummary,
  type OrganizerUpcomingWedding,
} from "@workspace/api-client-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddClientDialog } from "@/components/organizer/AddClientDialog";
import { useOrganizerI18n } from "@/components/organizer/useOrganizerI18n";

function StatCard({
  icon,
  value,
  label,
  testId,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  testId: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <div
            className="font-serif text-2xl font-bold text-foreground"
            data-testid={testId}
          >
            {value}
          </div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function daysBadgeVariant(days: number): "default" | "secondary" {
  return days <= 7 ? "default" : "secondary";
}

function UpcomingRow({ w }: { w: OrganizerUpcomingWedding }) {
  const { t, formatDate, statusLabel } = useOrganizerI18n();
  return (
    <Link
      href={`/organizer-dashboard/clients/${w.id}`}
      className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
      data-testid={`upcoming-${w.id}`}
    >
      <div className="min-w-0">
        <div className="truncate font-medium text-foreground">
          {w.clientName}
        </div>
        <div className="text-sm text-muted-foreground">
          {formatDate(w.weddingDate)} · {statusLabel(w.status)}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {w.pendingCount > 0 && (
          <span className="text-xs text-amber-600 dark:text-amber-500">
            {t("organizer.pendingCount", { count: w.pendingCount })}
          </span>
        )}
        <Badge variant={daysBadgeVariant(w.daysUntilWedding)}>
          {t("organizer.inDays", { count: w.daysUntilWedding })}
        </Badge>
      </div>
    </Link>
  );
}

function ClientsTable({ clients }: { clients: OrganizerClientSummary[] }) {
  const { t, fmt, formatDate, statusLabel } = useOrganizerI18n();
  const [, setLocation] = useLocation();

  if (clients.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border py-12 text-center text-muted-foreground">
        {t("organizer.noClients")}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("organizer.table.client")}</TableHead>
            <TableHead>{t("organizer.table.weddingDate")}</TableHead>
            <TableHead>{t("organizer.table.status")}</TableHead>
            <TableHead className="text-right">
              {t("organizer.table.budget")}
            </TableHead>
            <TableHead className="text-right">
              {t("organizer.table.undecided")}
            </TableHead>
            <TableHead className="text-center">
              {t("organizer.table.pending")}
            </TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((c) => (
            <TableRow
              key={c.id}
              className="cursor-pointer"
              onClick={() =>
                setLocation(`/organizer-dashboard/clients/${c.id}`)
              }
              data-testid={`client-row-${c.id}`}
            >
              <TableCell>
                <div className="font-medium text-foreground">
                  {c.clientName}
                </div>
                {c.linked ? (
                  <Badge variant="secondary" className="mt-1 font-normal">
                    {t("organizer.linked")}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {t("organizer.manual")}
                  </span>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDate(c.weddingDate)}
                {typeof c.daysUntilWedding === "number" &&
                  c.daysUntilWedding >= 0 && (
                    <div className="text-xs text-muted-foreground">
                      {t("organizer.inDays", { count: c.daysUntilWedding })}
                    </div>
                  )}
              </TableCell>
              <TableCell>
                <span className="text-sm">{statusLabel(c.status)}</span>
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {c.hasPlan && c.budgetTotal != null ? (
                  fmt(c.budgetTotal)
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {c.hasPlan && c.undecidedTotal != null ? (
                  <span
                    className={
                      c.undecidedTotal > 0
                        ? "text-amber-600 dark:text-amber-500"
                        : "text-muted-foreground"
                    }
                  >
                    {fmt(c.undecidedTotal)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {c.hasPlan ? (
                  <Badge
                    variant={c.pendingCount > 0 ? "default" : "secondary"}
                    className="font-normal"
                  >
                    {c.pendingCount}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function OrganizerDashboardPage() {
  const { t } = useOrganizerI18n();
  const [, setLocation] = useLocation();

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

  const { data: summary } = useGetOrganizerSummary({
    query: {
      queryKey: getGetOrganizerSummaryQueryKey(),
      enabled: isOrganizer,
      retry: false,
    },
  });
  const { data: clients, isLoading } = useListOrganizerClients({
    query: {
      queryKey: getListOrganizerClientsQueryKey(),
      enabled: isOrganizer,
      retry: false,
    },
  });

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 py-10">
        {user && !isOrganizer && (
          <div className="mx-auto max-w-3xl">
            <Card className="border-dashed">
              <CardContent className="p-12 text-center text-muted-foreground">
                {t("organizer.notOrganizer")}
              </CardContent>
            </Card>
          </div>
        )}

        {!user && !authLoading && (
          <div className="py-16 text-center">
            <Button asChild>
              <Link href="/login">{t("nav.login")}</Link>
            </Button>
          </div>
        )}

        {isOrganizer && (
          <>
            <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="font-serif text-4xl font-bold text-foreground">
                  {t("organizer.title")}
                </h1>
                <p className="mt-2 text-muted-foreground">
                  {t("organizer.subtitle")}
                </p>
              </div>
              <AddClientDialog />
            </header>

            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              <StatCard
                icon={<Users className="h-5 w-5" />}
                value={summary?.totalClients ?? 0}
                label={t("organizer.stats.totalClients")}
                testId="stat-total"
              />
              <StatCard
                icon={<CalendarClock className="h-5 w-5" />}
                value={summary?.upcomingCount ?? 0}
                label={t("organizer.stats.upcoming")}
                testId="stat-upcoming"
              />
              <StatCard
                icon={<AlertTriangle className="h-5 w-5" />}
                value={summary?.unresolvedClientCount ?? 0}
                label={t("organizer.stats.unresolved")}
                testId="stat-unresolved"
              />
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              <section className="lg:col-span-1">
                <h2 className="mb-3 font-serif text-xl font-semibold text-foreground">
                  {t("organizer.upcomingTitle")}
                </h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  {t("organizer.upcomingSubtitle")}
                </p>
                {summary && summary.upcoming.length > 0 ? (
                  <div className="space-y-3" data-testid="upcoming-list">
                    {summary.upcoming.map((w) => (
                      <UpcomingRow key={w.id} w={w} />
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                    {t("organizer.noUpcoming")}
                  </p>
                )}
              </section>

              <section className="lg:col-span-2">
                <h2 className="mb-3 font-serif text-xl font-semibold text-foreground">
                  {t("organizer.clientsTitle")}
                </h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  {t("organizer.clientsSubtitle")}
                </p>
                {isLoading ? (
                  <div className="h-64 animate-pulse rounded-xl bg-muted/50" />
                ) : (
                  <ClientsTable clients={clients ?? []} />
                )}
              </section>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
