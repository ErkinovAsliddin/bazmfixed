import { useQueryClient } from "@tanstack/react-query";
import {
  useAdminListProducts,
  getAdminListProductsQueryKey,
  useAdminUpdateProduct,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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

export function AdminProductsTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: products, isLoading } = useAdminListProducts({
    query: { queryKey: getAdminListProductsQueryKey(), retry: false },
  });
  const update = useAdminUpdateProduct();

  const toggle = (id: number, isActive: boolean) => {
    update.mutate(
      { id, data: { isActive } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getAdminListProductsQueryKey(),
          });
        },
        onError: () =>
          toast({ title: "Failed to update product", variant: "destructive" }),
      },
    );
  };

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted/50" />;
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Seller</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(products ?? []).map((p) => (
              <TableRow key={p.id} data-testid={`admin-product-${p.id}`}>
                <TableCell className="font-medium text-foreground">
                  {p.name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {p.sellerName ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{p.category}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {formatUZS(p.pricePerUnit, "en")}
                </TableCell>
                <TableCell className="text-right">{p.stockQuantity}</TableCell>
                <TableCell>
                  <Switch
                    checked={p.isActive}
                    onCheckedChange={(c) => toggle(p.id, c)}
                    aria-label="Active"
                    data-testid={`product-active-${p.id}`}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
