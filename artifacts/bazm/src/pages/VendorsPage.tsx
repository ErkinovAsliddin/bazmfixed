import { useMemo, useState } from "react";
import { Store } from "lucide-react";
import {
  useListVendors,
  getListVendorsQueryKey,
} from "@workspace/api-client-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { VendorCard } from "@/components/vendors/VendorCard";
import { VendorFilters } from "@/components/vendors/VendorFilters";
import { useVendorI18n } from "@/components/vendors/useVendorI18n";

export default function VendorsPage() {
  const { t } = useVendorI18n();
  const [category, setCategory] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);

  // The catalog is small (~18 vendors), so we fetch once and filter on the
  // client — this keeps the city options in sync with the actual data.
  const { data: vendors, isLoading } = useListVendors(undefined, {
    query: { queryKey: getListVendorsQueryKey(), retry: false },
  });

  const cities = useMemo(
    () => Array.from(new Set((vendors ?? []).map((v) => v.city))).sort(),
    [vendors],
  );

  const filtered = useMemo(
    () =>
      (vendors ?? []).filter(
        (v) =>
          (category === null || v.category === category) &&
          (city === null || v.city === city),
      ),
    [vendors, category, city],
  );

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 py-12">
        <header className="mb-8">
          <h1 className="font-serif text-4xl font-bold text-foreground">
            {t("vendors.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {t("vendors.subtitle")}
          </p>
        </header>

        <div className="mb-8">
          <VendorFilters
            category={category}
            city={city}
            cities={cities}
            onCategory={setCategory}
            onCity={setCity}
          />
        </div>

        {isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-xl bg-muted/50"
              />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="rounded-lg border border-dashed border-border">
            <EmptyState
              data-testid="vendors-empty"
              icon={Store}
              title={
                category !== null || city !== null
                  ? t("vendors.empty")
                  : t("vendors.noVendors")
              }
              description={
                category !== null || city !== null
                  ? t("empty.vendorsDesc")
                  : t("vendors.comingSoon")
              }
              action={
                (category !== null || city !== null) && (
                  <Button
                    variant="outline"
                    className="press"
                    onClick={() => {
                      setCategory(null);
                      setCity(null);
                    }}
                  >
                    {t("common.clearFilters", {
                      defaultValue: "Clear filters",
                    })}
                  </Button>
                )
              }
            />
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
