import { TrendingUp } from "lucide-react";
import {
  useGetDasturxonStats,
  getGetDasturxonStatsQueryKey,
} from "@workspace/api-client-react";
import { useDasturxonI18n } from "./useDasturxonI18n";

/** At-a-glance local benchmark: average food spend per guest for a city. */
export function DasturxonStatsBar({ city }: { city: string | null }) {
  const { t, fmt, num, cityLabel } = useDasturxonI18n();
  const params = city ? { city } : undefined;

  const { data } = useGetDasturxonStats(params, {
    query: { queryKey: getGetDasturxonStatsQueryKey(params), retry: false },
  });

  const scope = city ? cityLabel(city) : t("dasturxon.stats.allCities");
  const empty = !data || data.entryCount === 0;

  return (
    <div
      className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/10 p-6"
      data-testid="dasturxon-stats"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-primary">
        <TrendingUp className="h-4 w-4" />
        {t("dasturxon.stats.title", { scope })}
      </div>

      {empty ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {t("dasturxon.stats.empty")}
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap items-end gap-x-10 gap-y-4">
          <div>
            <p className="font-serif text-3xl font-bold text-foreground">
              {fmt(data.avgSpendPerGuest)}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("dasturxon.stats.perGuest")}
            </p>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              {t("dasturxon.stats.avgTotal")}:{" "}
              <span className="font-medium text-foreground">
                {fmt(data.avgTotalSpend)}
              </span>
            </p>
            <p>
              {t("dasturxon.stats.avgGuests")}:{" "}
              <span className="font-medium text-foreground">
                {num(data.avgGuestCount)}
              </span>
            </p>
            <p>
              {t("dasturxon.stats.basedOn", { count: data.entryCount })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
