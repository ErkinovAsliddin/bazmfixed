import { Users, Utensils } from "lucide-react";
import type { DasturxonEntry } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDasturxonI18n } from "./useDasturxonI18n";

const PREVIEW_COUNT = 7;

/** One anonymized real wedding: guests, spend, and a preview of the table. */
export function DasturxonCard({ entry }: { entry: DasturxonEntry }) {
  const { t, fmt, num, cityLabel, dishLabel } = useDasturxonI18n();
  const shown = entry.items.slice(0, PREVIEW_COUNT);
  const rest = entry.items.length - shown.length;

  return (
    <Card
      className="overflow-hidden border-border/70 transition-shadow hover:shadow-md"
      data-testid={`dasturxon-card-${entry.id}`}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4 shrink-0" />
          <span>
            {t("dasturxon.card.headline", {
              city: cityLabel(entry.city),
              count: num(entry.guestCount),
            })}
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("dasturxon.card.totalSpend")}
            </p>
            <p className="font-serif text-2xl font-bold text-foreground">
              {fmt(entry.totalSpentOnFood)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("dasturxon.card.perGuest")}
            </p>
            <p className="font-semibold text-primary">{fmt(entry.perGuestSpend)}</p>
          </div>
        </div>

        <div className="mt-5 border-t border-border/60 pt-4">
          <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
            <Utensils className="h-4 w-4 text-accent-foreground" />
            {t("dasturxon.card.onTheTable")}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {shown.map((item, i) => (
              <Badge key={i} variant="secondary" className="font-normal">
                {dishLabel(item.itemName)}
                {item.quantity > 0 && (
                  <span className="ml-1 text-muted-foreground">
                    ×{num(item.quantity)}
                  </span>
                )}
              </Badge>
            ))}
            {rest > 0 && (
              <Badge variant="outline" className="font-normal">
                {t("dasturxon.card.andMore", { count: rest })}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
