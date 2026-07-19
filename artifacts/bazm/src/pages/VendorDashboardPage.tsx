import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Inbox, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCurrentUser,
  useGetMyVendor,
  useUpsertMyVendor,
  useDeleteMyVendorTier,
  getGetCurrentUserQueryKey,
  getGetMyVendorQueryKey,
  type VendorWithTiers,
  type VendorCategory,
} from "@workspace/api-client-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ImageUploader } from "@/components/ImageUploader";
import { VendorTierDialog } from "@/components/vendors/VendorTierDialog";
import { VendorPhoto } from "@/components/vendors/VendorPhoto";
import { VENDOR_CATEGORIES } from "@/components/vendors/VendorFilters";
import { useVendorI18n } from "@/components/vendors/useVendorI18n";
import { ProductsTab } from "@/components/seller/ProductsTab";
import { OrdersTab } from "@/components/seller/OrdersTab";

function ProfileForm({ vendor }: { vendor: VendorWithTiers | null | undefined }) {
  const { t, categoryLabel } = useVendorI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const upsert = useUpsertMyVendor();

  const [businessName, setBusinessName] = useState(vendor?.businessName ?? "");
  const [category, setCategory] = useState<VendorCategory>(
    vendor?.category ?? "venue",
  );
  const [city, setCity] = useState(vendor?.city ?? "");
  const [address, setAddress] = useState(vendor?.address ?? "");
  const [description, setDescription] = useState(vendor?.description ?? "");
  const [phone, setPhone] = useState(vendor?.phone ?? "");
  const [photos, setPhotos] = useState<string[]>(vendor?.photos ?? []);

  // Re-sync when the fetched profile arrives after first render.
  useEffect(() => {
    if (vendor) {
      setBusinessName(vendor.businessName);
      setCategory(vendor.category);
      setCity(vendor.city);
      setAddress(vendor.address ?? "");
      setDescription(vendor.description ?? "");
      setPhone(vendor.phone ?? "");
      setPhotos(vendor.photos ?? []);
    }
  }, [vendor]);

  const canSave =
    businessName.trim().length > 0 &&
    city.trim().length > 0 &&
    address.trim().length > 0 &&
    photos.length >= 2;

  const handleSave = () => {
    if (!canSave) {
      toast({
        title: t("vendors.dashboard.invalidProfile"),
        variant: "destructive",
      });
      return;
    }
    upsert.mutate(
      {
        data: {
          businessName: businessName.trim(),
          category,
          city: city.trim(),
          address: address.trim(),
          description: description.trim() || null,
          phone: phone.trim() || null,
          photos,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMyVendorQueryKey() });
          toast({ title: t("vendors.dashboard.saved") });
        },
        onError: () =>
          toast({
            title: t("vendors.dashboard.saveError"),
            variant: "destructive",
          }),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-xl">
          {t("vendors.dashboard.profile")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="biz-name">
            {t("vendors.dashboard.businessName")}
          </Label>
          <Input
            id="biz-name"
            value={businessName}
            maxLength={120}
            onChange={(e) => setBusinessName(e.target.value)}
            data-testid="profile-name"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("vendors.dashboard.category")}</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as VendorCategory)}
            >
              <SelectTrigger data-testid="profile-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VENDOR_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {categoryLabel(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="biz-city">{t("vendors.dashboard.city")}</Label>
            <Input
              id="biz-city"
              value={city}
              maxLength={80}
              onChange={(e) => setCity(e.target.value)}
              data-testid="profile-city"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="biz-address">{t("vendors.address")}</Label>
          <Input
            id="biz-address"
            value={address}
            maxLength={200}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t("vendors.addressPlaceholder")}
            data-testid="profile-address"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="biz-phone">{t("vendors.dashboard.phone")}</Label>
          <Input
            id="biz-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+998 ..."
            data-testid="profile-phone"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="biz-desc">
            {t("vendors.dashboard.description")}
          </Label>
          <Textarea
            id="biz-desc"
            value={description}
            rows={3}
            onChange={(e) => setDescription(e.target.value)}
            data-testid="profile-desc"
          />
        </div>

        <div className="space-y-2">
          <Label>{t("vendors.photos")}</Label>
          <ImageUploader value={photos} onChange={setPhotos} max={8} />
          {photos.length < 2 && (
            <p
              className="text-xs text-destructive"
              data-testid="profile-photos-hint"
            >
              {t("vendors.photosHint")}
            </p>
          )}
        </div>

        <div
          className="flex items-start gap-3 rounded-lg border border-accent/40 bg-accent/10 p-4 text-sm text-muted-foreground"
          data-testid="profile-pending-notice"
        >
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent-foreground" />
          <p>{t("vendors.pendingApproval")}</p>
        </div>

        <Button
          onClick={handleSave}
          disabled={upsert.isPending || !canSave}
          data-testid="profile-save"
        >
          {upsert.isPending
            ? t("vendors.dashboard.saving")
            : vendor
              ? t("vendors.dashboard.save")
              : t("vendors.dashboard.createProfile")}
        </Button>
      </CardContent>
    </Card>
  );
}

function TiersSection({ vendor }: { vendor: VendorWithTiers }) {
  const { t, fmt, tierLabel, unitLabel } = useVendorI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const del = useDeleteMyVendorTier();

  const handleDelete = (tierId: number) => {
    if (!window.confirm(t("vendors.dashboard.deleteConfirm"))) return;
    del.mutate(
      { tierId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMyVendorQueryKey() });
          toast({ title: t("vendors.dashboard.tierDeleted") });
        },
        onError: () =>
          toast({
            title: t("vendors.dashboard.saveError"),
            variant: "destructive",
          }),
      },
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-serif text-xl">
          {t("vendors.dashboard.tiers")}
        </CardTitle>
        <VendorTierDialog
          trigger={
            <Button size="sm" data-testid="add-tier">
              <Plus className="h-4 w-4" />
              {t("vendors.dashboard.addTier")}
            </Button>
          }
        />
      </CardHeader>
      <CardContent>
        {vendor.tiers.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border py-10 text-center text-muted-foreground">
            {t("vendors.dashboard.noTiers")}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {vendor.tiers.map((tier) => (
              <li
                key={tier.id}
                className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                data-testid={`dashboard-tier-${tier.id}`}
              >
                <VendorPhoto
                  photo={tier.photos?.[0] ?? null}
                  category={vendor.category}
                  className="h-16 w-16 shrink-0 rounded-lg"
                  iconClassName="h-6 w-6"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="font-normal">
                      {tierLabel(tier.tierName)}
                    </Badge>
                    <span className="font-semibold text-foreground">
                      {fmt(tier.pricePerUnit)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {unitLabel(tier.unitType)}
                    </span>
                  </div>
                  {tier.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {tier.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <VendorTierDialog
                    tier={tier}
                    trigger={
                      <Button variant="ghost" size="icon" aria-label={t("vendors.dashboard.edit")}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("vendors.dashboard.delete")}
                    onClick={() => handleDelete(tier.id)}
                    data-testid={`delete-tier-${tier.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default function VendorDashboardPage() {
  const { t, num } = useVendorI18n();
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

  const isVendor = user?.role === "vendor";

  const { data: profile, isLoading } = useGetMyVendor({
    query: {
      queryKey: getGetMyVendorQueryKey(),
      enabled: isVendor,
      retry: false,
    },
  });

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 py-12">
        <div className="mx-auto max-w-5xl">
          {user && !isVendor && (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center text-muted-foreground">
                {t("vendors.dashboard.notVendor")}
              </CardContent>
            </Card>
          )}

          {isVendor && (
            <>
              <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="font-serif text-4xl font-bold text-foreground">
                    {t("vendors.dashboard.title")}
                  </h1>
                  <p className="mt-2 text-muted-foreground">
                    {t("vendors.dashboard.subtitle")}
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
                  <Inbox className="h-5 w-5 text-primary" />
                  <div>
                    <div
                      className="font-serif text-2xl font-bold text-foreground"
                      data-testid="inquiry-count"
                    >
                      {num(profile?.inquiryCount ?? 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("vendors.dashboard.inquiriesReceived")}
                    </div>
                  </div>
                </div>
              </header>

              {isLoading ? (
                <div className="h-64 animate-pulse rounded-xl bg-muted/50" />
              ) : (
                <Tabs defaultValue="profile" className="space-y-6">
                  <TabsList>
                    <TabsTrigger value="profile" data-testid="tab-profile">
                      {t("vendors.dashboard.tabProfile")}
                    </TabsTrigger>
                    <TabsTrigger value="products" data-testid="tab-products">
                      {t("vendors.dashboard.tabProducts")}
                    </TabsTrigger>
                    <TabsTrigger value="orders" data-testid="tab-orders">
                      {t("vendors.dashboard.tabOrders")}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="profile" className="space-y-6">
                    <ProfileForm vendor={profile?.vendor} />
                    {profile?.vendor ? (
                      <TiersSection vendor={profile.vendor} />
                    ) : (
                      <p className="text-center text-sm text-muted-foreground">
                        {t("vendors.dashboard.createFirst")}
                      </p>
                    )}
                  </TabsContent>

                  <TabsContent value="products">
                    {profile?.vendor ? (
                      <ProductsTab />
                    ) : (
                      <p className="text-center text-sm text-muted-foreground">
                        {t("vendors.dashboard.createFirst")}
                      </p>
                    )}
                  </TabsContent>

                  <TabsContent value="orders">
                    {profile?.vendor ? (
                      <OrdersTab />
                    ) : (
                      <p className="text-center text-sm text-muted-foreground">
                        {t("vendors.dashboard.createFirst")}
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </>
          )}

          {!user && !authLoading && (
            <div className="py-16 text-center">
              <Button asChild>
                <Link href="/login">{t("nav.login")}</Link>
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
