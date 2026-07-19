import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAdminListOrders,
  getAdminListOrdersQueryKey,
  useAdminUpdateOrderStatus,
  type AdminListOrdersParams,
  type AdminListOrdersStatus,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatUZS } from "@/lib/format";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";

const STATUSES = ["pending", "confirmed", "fulfilled", "cancelled"] as const;

export function AdminOrdersTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>("all");

  const params: AdminListOrdersParams | undefined =
    filter === "all" ? undefined : { status: filter as AdminListOrdersStatus };

  const { data: orders, isLoading } = useAdminListOrders(params, {
    query: { queryKey: getAdminListOrdersQueryKey(params), retry: false },
  });
  const update = useAdminUpdateOrderStatus();

  const changeStatus = (id: number, status: string) => {
    update.mutate(
      { id, data: { status: status as (typeof STATUSES)[number] } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getAdminListOrdersQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getAdminListOrdersQueryKey(params),
          });
        },
        onError: () =>
          toast({ title: "Failed to update order", variant: "destructive" }),
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Filter:</span>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-8 w-40" data-testid="order-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="h-64 animate-pulse rounded-xl bg-muted/50" />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-40">Change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(orders ?? []).map((o) => (
                  <TableRow key={o.id} data-testid={`admin-order-${o.id}`}>
                    <TableCell className="font-medium text-foreground">
                      #{o.id}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {o.buyerName ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {o.sellerName ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">{o.itemCount}</TableCell>
                    <TableCell className="text-right">
                      {formatUZS(o.totalAmount, "en")}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={o.status} />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={o.status}
                        onValueChange={(v) => changeStatus(o.id, v)}
                        disabled={update.isPending}
                      >
                        <SelectTrigger
                          className="h-8"
                          data-testid={`admin-order-status-${o.id}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
