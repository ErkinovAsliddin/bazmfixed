import { Link } from "wouter";
import { BadgeCheck, MapPin } from "lucide-react";
import type { VendorSummary } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VendorPhoto } from "./VendorPhoto";
import { useVendorI18n } from "./useVendorI18n";

export function VendorCard({ vendor }: { vendor: VendorSummary }) {
  const { t, fmt, categoryLabel, cityLabel, unitLabel } = useVendorI18n();

  return (
    <Link
      href={`/vendors/${vendor.id}`}
      className="group block h-full"
      data-testid={`vendor-card-${vendor.id}`}
    >
      <Card className="h-full overflow-hidden pt-0 transition hover:border-primary/40 hover:shadow-md">
        <VendorPhoto
          photo={vendor.photos?.[0] ?? vendor.photo}
          category={vendor.category}
          className="h-40 w-full"
        />
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-serif text-lg font-semibold leading-tight text-foreground transition group-hover:text-primary">
              {vendor.businessName}
            </h3>
            {vendor.isVerified && (
              <BadgeCheck
                className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                aria-label={t("vendors.card.verified")}
              />
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary" className="font-normal">
              {categoryLabel(vendor.category)}
            </Badge>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {cityLabel(vendor.city)}
            </span>
          </div>

          {vendor.startingPrice != null && (
            <p className="mt-3 text-sm">
              <span className="text-muted-foreground">
                {t("vendors.card.startingFrom")}{" "}
              </span>
              <span className="font-semibold text-foreground">
                {fmt(vendor.startingPrice)}
              </span>
              {vendor.startingUnit && (
                <span className="text-muted-foreground">
                  {" · "}
                  {unitLabel(vendor.startingUnit)}
                </span>
              )}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
