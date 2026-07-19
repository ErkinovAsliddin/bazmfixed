import { Link, useParams } from "wouter";
import { ArrowLeft, BadgeCheck, LayoutGrid, MapPin } from "lucide-react";
import {
  useGetVendor,
  getGetVendorQueryKey,
} from "@workspace/api-client-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { resolvePhotoSrc } from "@/lib/utils";
import { TierComparisonTable } from "@/components/vendors/TierComparisonTable";
import { ContactVendorButton } from "@/components/vendors/ContactVendorButton";
import { useVendorI18n } from "@/components/vendors/useVendorI18n";

export default function VendorDetailPage() {
  const { t, categoryLabel, cityLabel } = useVendorI18n();
  const params = useParams();
  const id = Number(params.id);

  const {
    data: vendor,
    isLoading,
    isError,
  } = useGetVendor(id, {
    query: {
      queryKey: getGetVendorQueryKey(id),
      enabled: !Number.isNaN(id),
      retry: false,
    },
  });

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 py-12">
        <Button asChild variant="ghost" className="mb-6 -ml-2">
          <Link href="/vendors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("vendors.detail.back")}
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
              {t("vendors.detail.notFound")}
            </CardContent>
          </Card>
        )}

        {vendor && (
          <>
            <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-serif text-4xl font-bold text-foreground">
                    {vendor.businessName}
                  </h1>
                  {vendor.isVerified && (
                    <BadgeCheck
                      className="h-6 w-6 text-primary"
                      aria-label={t("vendors.card.verified")}
                    />
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary" className="font-normal">
                    {categoryLabel(vendor.category)}
                  </Badge>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {cityLabel(vendor.city)}
                  </span>
                </div>
                {vendor.address && (
                  <p
                    className="mt-2 inline-flex items-start gap-1.5 text-sm text-muted-foreground"
                    data-testid="vendor-address"
                  >
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {vendor.address}
                  </p>
                )}
                {vendor.description && (
                  <p className="mt-4 max-w-2xl text-muted-foreground">
                    {vendor.description}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                <ContactVendorButton
                  vendorId={vendor.id}
                  vendorName={vendor.businessName}
                  className="rounded-full px-6"
                />
                <Button asChild variant="outline" size="sm">
                  <Link href={`/vendors/category/${vendor.category}`}>
                    <LayoutGrid className="h-4 w-4" />
                    {t("vendors.detail.compareAll")}
                  </Link>
                </Button>
              </div>
            </header>

            {vendor.photos.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-4 font-serif text-2xl font-semibold text-foreground">
                  {t("vendors.gallery")}
                </h2>
                <div
                  className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
                  data-testid="vendor-gallery"
                >
                  {vendor.photos.map((photo, idx) => (
                    <div
                      key={`${photo}-${idx}`}
                      className="aspect-square overflow-hidden rounded-xl border border-border bg-muted"
                    >
                      <img
                        src={resolvePhotoSrc(photo)}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                        data-testid={`vendor-photo-${idx}`}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="font-serif text-2xl font-semibold text-foreground">
                {t("vendors.detail.tiersTitle")}
              </h2>
              <p className="mb-5 mt-1 text-sm text-muted-foreground">
                {t("vendors.detail.tiersSubtitle")}
              </p>
              <TierComparisonTable
                tiers={vendor.tiers}
                category={vendor.category}
              />
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
