import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Package,
  Store,
  ImageOff,
} from "lucide-react";
import {
  useListMarketplaceProducts,
  getListMarketplaceProductsQueryKey,
  useCheckoutCart,
  getListMyPurchasesQueryKey,
  useGetCurrentUser,
  getGetCurrentUserQueryKey,
  type MarketplaceProduct,
} from "@workspace/api-client-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { formatUZS } from "@/lib/format";
import { resolvePhotoSrc } from "@/lib/utils";
import { useCart } from "@/lib/cart";
import { MARKETPLACE_FILTERS } from "@/lib/productCategories";

function ProductImage({ product }: { product: MarketplaceProduct }) {
  const photo = product.photos?.[0];
  if (!photo) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-t-xl bg-muted/60 text-muted-foreground">
        <ImageOff className="h-8 w-8 opacity-50" />
      </div>
    );
  }
  return (
    <div className="aspect-[4/3] overflow-hidden rounded-t-xl bg-muted/60">
      <img
        src={resolvePhotoSrc(photo)}
        alt={product.name}
        loading="lazy"
        className="h-full w-full object-cover"
      />
    </div>
  );
}

function ProductCard({ product }: { product: MarketplaceProduct }) {
  const { t, i18n } = useTranslation();
  const { addItem, quantityOf } = useCart();
  const inCart = quantityOf(product.id);
  const outOfStock = product.stockQuantity <= 0;
  const atMax = inCart >= product.stockQuantity;

  return (
    <Card className="flex flex-col overflow-hidden" data-testid={`product-${product.id}`}>
      <ProductImage product={product} />
      <CardContent className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-lg font-semibold text-foreground">
            {product.name}
          </h3>
          <Badge variant="outline" className="shrink-0 text-xs">
            {t(`marketplace.categories.${product.category}`, {
              defaultValue: product.category,
            })}
          </Badge>
        </div>
        {product.sellerName && (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Store className="h-3 w-3" />
            {product.sellerName}
          </p>
        )}
        {product.description && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {product.description}
          </p>
        )}
        <div className="mt-3">
          {outOfStock ? (
            <Badge variant="destructive" className="text-xs">
              {t("marketplace.outOfStock")}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground" data-testid={`stock-${product.id}`}>
              {t("marketplace.inStock", { count: product.stockQuantity })}
            </span>
          )}
        </div>
        <div className="mt-4 flex items-end justify-between gap-3 pt-2">
          <div>
            <div className="font-serif text-xl font-bold text-primary">
              {formatUZS(product.pricePerUnit, i18n.language)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("marketplace.perUnit", {
                unit: t(`sufficiency.units.${product.unit}`, {
                  defaultValue: product.unit,
                }),
              })}
            </p>
          </div>
          <Button
            size="sm"
            variant={inCart ? "outline" : "default"}
            disabled={outOfStock || atMax}
            onClick={() => addItem(product.id, 1)}
            data-testid={`add-${product.id}`}
          >
            <Plus className="mr-1 h-4 w-4" />
            {inCart
              ? t("marketplace.inCart", { count: inCart })
              : t("marketplace.addToCart")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CartSheet({ products }: { products: MarketplaceProduct[] }) {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { items, count, addItem, setItem, removeItem, clear, syncNow } =
    useCart();

  const { data: user } = useGetCurrentUser({
    query: { queryKey: getGetCurrentUserQueryKey(), retry: false },
  });

  const checkout = useCheckoutCart();

  const byId = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );

  const lines = items
    .map((i) => ({ item: i, product: byId.get(i.productId) }))
    .filter((l): l is { item: typeof l.item; product: MarketplaceProduct } =>
      Boolean(l.product),
    );

  const total = lines.reduce(
    (sum, l) => sum + l.product.pricePerUnit * l.item.quantity,
    0,
  );

  const handleCheckout = async () => {
    if (!user) {
      setLocation("/login");
      return;
    }
    try {
      await syncNow();
      const result = await checkout.mutateAsync();
      clear();
      queryClient.invalidateQueries({
        queryKey: getListMarketplaceProductsQueryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: getListMyPurchasesQueryKey(),
      });
      toast({
        title: t("marketplace.checkoutSuccess", {
          count: result.orders.length,
        }),
      });
      setLocation("/orders");
    } catch {
      toast({
        title: t("marketplace.checkoutError"),
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative" data-testid="open-cart">
          <ShoppingCart className="mr-2 h-4 w-4" />
          {t("marketplace.cart")}
          {count > 0 && (
            <Badge className="ml-2 bg-primary text-primary-foreground">
              {count}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-serif">
            {t("marketplace.cartTitle")}
          </SheetTitle>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center">
            <EmptyState
              icon={ShoppingCart}
              title={t("marketplace.cartEmpty")}
              description={t("empty.cartDesc")}
            />
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto py-4">
              {lines.map(({ item, product }) => {
                const atMax = item.quantity >= product.stockQuantity;
                return (
                  <div
                    key={product.id}
                    className="rounded-lg border border-border p-3"
                    data-testid={`cart-line-${product.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatUZS(product.pricePerUnit, i18n.language)} ·{" "}
                          {t(`sufficiency.units.${product.unit}`, {
                            defaultValue: product.unit,
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(product.id)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={t("marketplace.remove")}
                        data-testid={`remove-${product.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => setItem(product.id, item.quantity - 1)}
                          aria-label={t("marketplace.decrease")}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <input
                          type="number"
                          min={0}
                          max={product.stockQuantity}
                          value={item.quantity}
                          onChange={(e) =>
                            setItem(
                              product.id,
                              Math.min(
                                product.stockQuantity,
                                Math.max(
                                  0,
                                  Math.floor(Number(e.target.value)) || 0,
                                ),
                              ),
                            )
                          }
                          className="h-7 w-16 rounded-md border border-input bg-background px-2 text-center text-sm"
                          data-testid={`qty-${product.id}`}
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          disabled={atMax}
                          onClick={() => addItem(product.id, 1)}
                          aria-label={t("marketplace.increase")}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="font-semibold text-foreground">
                        {formatUZS(
                          product.pricePerUnit * item.quantity,
                          i18n.language,
                        )}
                      </span>
                    </div>
                    {atMax && (
                      <p className="mt-1 text-right text-xs text-muted-foreground">
                        {t("marketplace.maxStock")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <SheetFooter className="border-t pt-4">
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between text-base">
                  <span className="text-muted-foreground">
                    {t("marketplace.total")}
                  </span>
                  <span
                    className="font-serif text-xl font-bold text-primary"
                    data-testid="cart-total"
                  >
                    {formatUZS(total, i18n.language)}
                  </span>
                </div>
                <Button
                  className="w-full"
                  onClick={handleCheckout}
                  disabled={checkout.isPending}
                  data-testid="checkout"
                >
                  {checkout.isPending
                    ? t("marketplace.checkingOut")
                    : user
                      ? t("marketplace.checkout")
                      : t("marketplace.loginToCheckout")}
                </Button>
                <Button variant="ghost" className="w-full" onClick={clear}>
                  {t("marketplace.clearCart")}
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function MarketplacePage() {
  const { t } = useTranslation();
  const [category, setCategory] =
    useState<(typeof MARKETPLACE_FILTERS)[number]>("all");

  const params = category === "all" ? undefined : { category };
  const { data: products, isLoading } = useListMarketplaceProducts(params, {
    query: { queryKey: getListMarketplaceProductsQueryKey(params) },
  });

  // The cart needs every product's details regardless of the active filter.
  const { data: allProducts } = useListMarketplaceProducts(undefined, {
    query: { queryKey: getListMarketplaceProductsQueryKey() },
  });

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <header className="max-w-2xl">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Package className="h-4 w-4" />
              {t("marketplace.eyebrow")}
            </div>
            <h1 className="mt-2 font-serif text-4xl font-bold text-foreground">
              {t("nav.marketplace")}
            </h1>
            <p className="mt-3 text-muted-foreground">
              {t("marketplace.subtitle")}
            </p>
          </header>
          <CartSheet products={allProducts ?? []} />
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {MARKETPLACE_FILTERS.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={category === c ? "default" : "outline"}
              onClick={() => setCategory(c)}
              data-testid={`filter-${c}`}
            >
              {t(`marketplace.categories.${c}`, { defaultValue: c })}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-xl bg-muted/50" />
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-muted/30">
            <EmptyState
              icon={Package}
              title={t("marketplace.empty")}
              description={t("empty.productsDesc")}
              action={
                category !== "all" && (
                  <Button
                    variant="outline"
                    className="press"
                    onClick={() => setCategory("all")}
                  >
                    {t("marketplace.categories.all", { defaultValue: "All" })}
                  </Button>
                )
              }
            />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
