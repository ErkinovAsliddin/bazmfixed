import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Inbox, User } from "lucide-react";
import {
  useListMyOrders,
  getListMyOrdersQueryKey,
  useUpdateMyOrderStatus,
  type SellerOrder,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatUZS } from "@/lib/format";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";

const STATUSES = ["pending", "confirmed", "fulfilled", "cancelled"] as const;

function formatDate(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

function OrderRow({ order }: { order: SellerOrder }) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const update = useUpdateMyOrderStatus();

  const handleChange = (status: string) => {
    update.mutate(
      {
        id: order.id,
        data: { status: status as (typeof STATUSES)[number] },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getListMyOrdersQueryKey(),
          });
          toast({ title: t("seller.orders.statusUpdated") });
        },
        onError: () =>
          toast({
            title: t("seller.orders.statusError"),
            variant: "destructive",
          }),
      },
    );
  };

  return (
    <Card data-testid={`seller-order-${order.id}`}>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-semibold text-foreground">
                {t("orders.orderNumber", { id: order.id })}
              </span>
              <OrderStatusBadge status={order.status} />
            </div>
            {order.buyerName && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                {order.buyerName}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {formatDate(order.createdAt, i18n.language)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="font-serif text-xl font-bold text-primary">
              {formatUZS(order.totalAmount, i18n.language)}
            </div>
            <Select
              value={order.status}
              onValueChange={handleChange}
              disabled={update.isPending}
            >
              <SelectTrigger
                className="h-8 w-40"
                data-testid={`order-status-${order.id}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`orders.status.${s}`, { defaultValue: s })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                <span className="text-muted-foreground"> × {item.quantity}</span>
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

export function OrdersTab() {
  const { t } = useTranslation();
  const { data: orders, isLoading } = useListMyOrders({
    query: { queryKey: getListMyOrdersQueryKey(), retry: false },
  });

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-xl font-semibold text-foreground">
        {t("seller.orders.title")}
      </h2>

      {isLoading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-muted/50" />
          ))}
        </div>
      ) : orders && orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((o) => (
            <OrderRow key={o.id} order={o} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-2">
            <EmptyState
              icon={Inbox}
              title={t("seller.orders.empty")}
              description={t("empty.sellerOrdersDesc")}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
