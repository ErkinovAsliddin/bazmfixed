import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { ShoppingBag, Store, X } from "lucide-react";
import {
  useGetCurrentUser,
  getGetCurrentUserQueryKey,
  useListMyPurchases,
  getListMyPurchasesQueryKey,
  useCancelMyOrder,
  getListMarketplaceProductsQueryKey,
  type BuyerOrder,
} from "@workspace/api-client-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";
import { formatUZS } from "@/lib/format";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";

function formatDate(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

function OrderCard({ order }: { order: BuyerOrder }) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const cancel = useCancelMyOrder();

  const handleCancel = () => {
    if (!window.confirm(t("orders.cancelConfirm"))) return;
    cancel.mutate(
      { id: order.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getListMyPurchasesQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getListMarketplaceProductsQueryKey(),
          });
          toast({ title: t("orders.cancelled") });
        },
        onError: () =>
          toast({ title: t("orders.cancelError"), variant: "destructive" }),
      },
    );
  };

  return (
    <Card data-testid={`order-${order.id}`}>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-semibold text-foreground">
                {t("orders.orderNumber", { id: order.id })}
              </span>
              <OrderStatusBadge status={order.status} />
            </div>
            {order.sellerName && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Store className="h-3 w-3" />
                {order.sellerName}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {formatDate(order.createdAt, i18n.language)}
            </p>
          </div>
          <div className="text-right">
            <div className="font-serif text-xl font-bold text-primary">
              {formatUZS(order.totalAmount, i18n.language)}
            </div>
            {order.status === "pending" && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 text-destructive hover:text-destructive"
                onClick={handleCancel}
                disabled={cancel.isPending}
                data-testid={`cancel-${order.id}`}
              >
                <X className="mr-1 h-3 w-3" />
                {t("orders.cancel")}
              </Button>
            )}
          </div>
        </div>

        <ul className="mt-4 divide-y divide-border border-t border-border pt-2">
          {order.items.map((item) => (
            <li
              key={item.productId}
              className="flex items-center justify-between gap-3 py-2 text-sm"
            >
              <span className="min-w-0 truncate text-foreground">
                {item.productName}
                <span className="text-muted-foreground">
                  {" "}
                  × {item.quantity}
                </span>
              </span>
              <span className="shrink-0 text-muted-foreground">
                {formatUZS(item.lineTotal, i18n.language)}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function MyOrdersPage() {
  const { t } = useTranslation();
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

  const { data: orders, isLoading } = useListMyPurchases({
    query: {
      queryKey: getListMyPurchasesQueryKey(),
      enabled: Boolean(user),
      retry: false,
    },
  });

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <header className="mb-8">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <ShoppingBag className="h-4 w-4" />
              {t("orders.eyebrow")}
            </div>
            <h1 className="mt-2 font-serif text-4xl font-bold text-foreground">
              {t("orders.title")}
            </h1>
          </header>

          {isLoading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-40 animate-pulse rounded-xl bg-muted/50" />
              ))}
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((o) => (
                <OrderCard key={o.id} order={o} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-2">
                <EmptyState
                  icon={ShoppingBag}
                  title={t("orders.empty")}
                  description={t("empty.ordersDesc")}
                  action={
                    <Button asChild className="press">
                      <Link href="/marketplace">
                        {t("orders.browseMarketplace")}
                      </Link>
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
