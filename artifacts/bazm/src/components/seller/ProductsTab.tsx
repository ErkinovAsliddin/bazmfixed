import { useTranslation } from "react-i18next";
import { Pencil, Plus, Package } from "lucide-react";
import {
  useListMyProducts,
  getListMyProductsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatUZS } from "@/lib/format";
import { ProductDialog } from "./ProductDialog";

export function ProductsTab() {
  const { t, i18n } = useTranslation();
  const { data: products, isLoading } = useListMyProducts({
    query: { queryKey: getListMyProductsQueryKey(), retry: false },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-semibold text-foreground">
          {t("seller.products.title")}
        </h2>
        <ProductDialog
          trigger={
            <Button size="sm" data-testid="add-product">
              <Plus className="h-4 w-4" />
              {t("seller.products.add")}
            </Button>
          }
        />
      </div>

      {isLoading ? (
        <div className="h-64 animate-pulse rounded-xl bg-muted/50" />
      ) : products && products.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("seller.products.name")}</TableHead>
                  <TableHead>{t("seller.products.category")}</TableHead>
                  <TableHead className="text-right">
                    {t("seller.products.price")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("seller.products.stock")}
                  </TableHead>
                  <TableHead>{t("seller.products.status")}</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id} data-testid={`my-product-${p.id}`}>
                    <TableCell className="font-medium text-foreground">
                      {p.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {t(`marketplace.categories.${p.category}`, {
                        defaultValue: p.category,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatUZS(p.pricePerUnit, i18n.language)}
                    </TableCell>
                    <TableCell className="text-right">{p.stockQuantity}</TableCell>
                    <TableCell>
                      <Badge variant={p.isActive ? "default" : "secondary"}>
                        {p.isActive
                          ? t("seller.products.activeLabel")
                          : t("seller.products.inactiveLabel")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ProductDialog
                        product={p}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t("seller.products.edit")}
                            data-testid={`edit-product-${p.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-2">
            <EmptyState
              icon={Package}
              title={t("seller.products.empty")}
              description={t("empty.sellerProductsDesc")}
              action={
                <ProductDialog
                  trigger={
                    <Button className="press">
                      <Plus className="mr-1 h-4 w-4" />
                      {t("seller.products.add")}
                    </Button>
                  }
                />
              }
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
