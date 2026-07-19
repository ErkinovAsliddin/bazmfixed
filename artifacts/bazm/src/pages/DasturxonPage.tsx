import { useMemo, useState } from "react";
import { Link } from "wouter";
import { PlusCircle, Lock, Globe, Heart } from "lucide-react";
import { resolvePhotoSrc } from "@/lib/utils";
import {
  useListDasturxon,
  getListDasturxonQueryKey,
  useGetCurrentUser,
  getGetCurrentUserQueryKey,
  useListMyDasturxon,
  getListMyDasturxonQueryKey,
} from "@workspace/api-client-react";
import type { DasturxonEntry } from "@workspace/api-client-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import { DasturxonCard } from "@/components/dasturxon/DasturxonCard";
import {
  DasturxonFilters,
  type GuestRange,
} from "@/components/dasturxon/DasturxonFilters";
import { DasturxonStatsBar } from "@/components/dasturxon/DasturxonStatsBar";
import { DasturxonComparison } from "@/components/dasturxon/DasturxonComparison";
import { SubmitDasturxonDialog } from "@/components/dasturxon/SubmitDasturxonDialog";
import { useDasturxonI18n } from "@/components/dasturxon/useDasturxonI18n";

const KNOWN_CITIES = ["Tashkent", "Samarkand", "Bukhara", "Other"];

/** A horizontal photo strip for a dasturxon entry. Defensive against empty. */
function DasturxonPhotoStrip({
  photos,
  alt,
  size = "md",
}: {
  photos?: string[] | null;
  alt: string;
  size?: "sm" | "md";
}) {
  const list = (photos ?? []).filter(Boolean);
  if (list.length === 0) return null;
  const dim = size === "sm" ? "h-14 w-14" : "h-24 w-24";
  return (
    <div className="flex gap-2 overflow-x-auto">
      {list.map((photo, i) => (
        <img
          key={`${photo}-${i}`}
          src={resolvePhotoSrc(photo)}
          alt={alt}
          loading="lazy"
          className={`${dim} shrink-0 rounded-lg border border-border object-cover`}
          data-testid={`dx-photo-${i}`}
        />
      ))}
    </div>
  );
}

export default function DasturxonPage() {
  const { t, fmt, num, cityLabel, dishLabel } = useDasturxonI18n();
  const [city, setCity] = useState<string | null>(null);
  const [range, setRange] = useState<GuestRange>({ min: null, max: null });
  const [detail, setDetail] = useState<DasturxonEntry | null>(null);

  const { data: user } = useGetCurrentUser({
    query: { queryKey: getGetCurrentUserQueryKey(), retry: false },
  });

  // Server-side filtering keeps the feed honest as the dataset grows.
  const params = {
    ...(city ? { city } : {}),
    ...(range.min !== null ? { minGuests: range.min } : {}),
    ...(range.max !== null ? { maxGuests: range.max } : {}),
  };
  const { data: entries, isLoading } = useListDasturxon(params, {
    query: { queryKey: getListDasturxonQueryKey(params), retry: false },
  });

  // Unfiltered fetch drives the city dropdown so options don't disappear.
  const { data: allEntries } = useListDasturxon(undefined, {
    query: { queryKey: getListDasturxonQueryKey(), retry: false },
  });
  const cities = useMemo(() => {
    const fromData = new Set((allEntries ?? []).map((e) => e.city));
    return KNOWN_CITIES.filter((c) => fromData.has(c)).concat(
      [...fromData].filter((c) => !KNOWN_CITIES.includes(c)).sort(),
    );
  }, [allEntries]);

  const { data: mine } = useListMyDasturxon({
    query: {
      queryKey: getListMyDasturxonQueryKey(),
      enabled: !!user,
      retry: false,
    },
  });

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 py-12">
        <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-primary">
              <Heart className="h-5 w-5" />
              <span className="text-sm font-medium uppercase tracking-wide">
                {t("dasturxon.eyebrow")}
              </span>
            </div>
            <h1 className="font-serif text-4xl font-bold text-foreground">
              {t("dasturxon.title")}
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {t("dasturxon.subtitle")}
            </p>
          </div>
          {user ? (
            <SubmitDasturxonDialog
              trigger={
                <Button size="lg" data-testid="dx-share-cta">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  {t("dasturxon.shareCta")}
                </Button>
              }
            />
          ) : (
            <Button asChild size="lg" variant="outline">
              <Link href="/login">
                <PlusCircle className="mr-2 h-5 w-5" />
                {t("dasturxon.shareCtaGuest")}
              </Link>
            </Button>
          )}
        </header>

        <div className="mb-8">
          <DasturxonStatsBar city={city} />
        </div>

        {user && (
          <div className="mb-10">
            <DasturxonComparison />
          </div>
        )}

        {user && mine && mine.length > 0 && (
          <section className="mb-10" data-testid="dx-mine">
            <h2 className="mb-3 font-serif text-xl font-bold text-foreground">
              {t("dasturxon.mine.title")}
            </h2>
            <div className="flex flex-col gap-2">
              {mine.map((e) => (
                <div
                  key={e.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <DasturxonPhotoStrip
                      photos={e.photos}
                      alt={cityLabel(e.city)}
                      size="sm"
                    />
                    <span className="text-foreground">
                      {t("dasturxon.card.headline", {
                        city: cityLabel(e.city),
                        count: num(e.guestCount),
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-foreground">
                      {fmt(e.totalSpentOnFood)}
                    </span>
                    <Badge variant={e.isPublic ? "secondary" : "outline"}>
                      {e.isPublic ? (
                        <Globe className="mr-1 h-3 w-3" />
                      ) : (
                        <Lock className="mr-1 h-3 w-3" />
                      )}
                      {e.isPublic
                        ? t("dasturxon.mine.public")
                        : t("dasturxon.mine.private")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mb-6 flex flex-col gap-4 border-t border-border/60 pt-8">
          <h2 className="font-serif text-2xl font-bold text-foreground">
            {t("dasturxon.feed.title")}
          </h2>
          <DasturxonFilters
            city={city}
            cities={cities}
            range={range}
            onCity={setCity}
            onRange={setRange}
          />
        </div>

        {isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-muted/50" />
            ))}
          </div>
        )}

        {!isLoading && (entries ?? []).length === 0 && (
          <div className="rounded-lg border border-dashed border-border">
            <EmptyState
              data-testid="dasturxon-empty"
              icon={Heart}
              title={t("dasturxon.feed.empty")}
              description={t("empty.dasturxonDesc")}
              action={
                user ? (
                  <SubmitDasturxonDialog
                    trigger={
                      <Button className="press">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {t("empty.dasturxonCta")}
                      </Button>
                    }
                  />
                ) : (
                  <Button asChild variant="outline" className="press">
                    <Link href="/login">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      {t("dasturxon.shareCtaGuest")}
                    </Link>
                  </Button>
                )
              }
            />
          </div>
        )}

        {!isLoading && (entries ?? []).length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(entries ?? []).map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setDetail(entry)}
                className="flex flex-col gap-3 text-left"
                data-testid={`dx-feed-open-${entry.id}`}
              >
                {(entry.photos ?? []).length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {(entry.photos ?? []).slice(0, 4).map((photo, i) => (
                      <img
                        key={`${photo}-${i}`}
                        src={resolvePhotoSrc(photo)}
                        alt={cityLabel(entry.city)}
                        loading="lazy"
                        className="aspect-square w-full rounded-xl border border-border object-cover"
                        data-testid={`dx-feed-photo-${entry.id}-${i}`}
                      />
                    ))}
                  </div>
                )}
                <DasturxonCard entry={entry} />
              </button>
            ))}
          </div>
        )}

        <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            {detail && (
              <>
                <DialogHeader>
                  <DialogTitle className="font-serif">
                    {t("dasturxon.card.headline", {
                      city: cityLabel(detail.city),
                      count: num(detail.guestCount),
                    })}
                  </DialogTitle>
                </DialogHeader>

                {(detail.photos ?? []).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      {t("dasturxon.gallery")}
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {(detail.photos ?? []).map((photo, i) => (
                        <img
                          key={`${photo}-${i}`}
                          src={resolvePhotoSrc(photo)}
                          alt={cityLabel(detail.city)}
                          loading="lazy"
                          className="aspect-square w-full rounded-xl border border-border object-cover"
                          data-testid={`dx-detail-photo-${i}`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t("dasturxon.card.totalSpend")}
                    </p>
                    <p className="font-serif text-2xl font-bold text-foreground">
                      {fmt(detail.totalSpentOnFood)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t("dasturxon.card.perGuest")}
                    </p>
                    <p className="font-semibold text-primary">
                      {fmt(detail.perGuestSpend)}
                    </p>
                  </div>
                </div>

                <div className="border-t border-border/60 pt-4">
                  <p className="mb-2 text-sm font-medium text-foreground">
                    {t("dasturxon.card.onTheTable")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.items.map((item, i) => (
                      <Badge key={i} variant="secondary" className="font-normal">
                        {dishLabel(item.itemName)}
                        {item.quantity > 0 && (
                          <span className="ml-1 text-muted-foreground">
                            ×{num(item.quantity)}
                          </span>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}
