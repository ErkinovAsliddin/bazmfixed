import type { VendorTier } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { VendorPhoto } from "./VendorPhoto";
import { useVendorI18n } from "./useVendorI18n";

/**
 * A single vendor's tiers laid out side-by-side for comparison (tier name,
 * price, unit, description, photos).
 */
export function TierComparisonTable({
  tiers,
  category,
}: {
  tiers: VendorTier[];
  category: string;
}) {
  const { t, fmt, tierLabel, unitLabel } = useVendorI18n();

  if (tiers.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border py-10 text-center text-muted-foreground">
        {t("vendors.detail.noTiers")}
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tiers.map((tier) => (
        <div
          key={tier.id}
          className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
          data-testid={`tier-${tier.id}`}
        >
          <VendorPhoto
            photo={tier.photos[0] ?? null}
            category={category}
            className="h-32 w-full"
          />
          <div className="flex flex-1 flex-col p-4">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="secondary" className="font-normal">
                {tierLabel(tier.tierName)}
              </Badge>
            </div>
            <p className="mt-3 font-serif text-xl font-bold text-primary">
              {fmt(tier.pricePerUnit)}
            </p>
            <p className="text-xs text-muted-foreground">
              {unitLabel(tier.unitType)}
            </p>
            {tier.description && (
              <p className="mt-3 text-sm text-muted-foreground">
                {tier.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
