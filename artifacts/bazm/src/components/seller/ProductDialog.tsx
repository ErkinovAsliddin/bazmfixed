import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateMyProduct,
  useUpdateMyProduct,
  getListMyProductsQueryKey,
  type SellerProduct,
} from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PRODUCT_CATEGORIES } from "@/lib/productCategories";
import { ImageUploader } from "@/components/ImageUploader";

interface Props {
  product?: SellerProduct;
  trigger: ReactNode;
}

export function ProductDialog({ product, trigger }: Props) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const create = useCreateMyProduct();
  const update = useUpdateMyProduct();
  const isEdit = Boolean(product);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(PRODUCT_CATEGORIES[0]);
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [unit, setUnit] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  // Reset the form to the product's values whenever the dialog opens.
  useEffect(() => {
    if (!open) return;
    setName(product?.name ?? "");
    setCategory(product?.category ?? PRODUCT_CATEGORIES[0]);
    setPricePerUnit(product ? String(product.pricePerUnit) : "");
    setUnit(product?.unit ?? "");
    setStockQuantity(product ? String(product.stockQuantity) : "");
    setDescription(product?.description ?? "");
    setPhotos(product?.photos ?? []);
    setIsActive(product?.isActive ?? true);
  }, [open, product]);

  const pending = create.isPending || update.isPending;

  const handleSave = () => {
    const price = Math.floor(Number(pricePerUnit));
    const stock = Math.floor(Number(stockQuantity));
    if (
      name.trim().length === 0 ||
      unit.trim().length === 0 ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isFinite(stock) ||
      stock < 0
    ) {
      toast({ title: t("seller.products.invalid"), variant: "destructive" });
      return;
    }

    const data = {
      name: name.trim(),
      category,
      pricePerUnit: price,
      unit: unit.trim(),
      stockQuantity: stock,
      description: description.trim() || null,
      photos,
      isActive,
    };

    const onSuccess = () => {
      queryClient.invalidateQueries({ queryKey: getListMyProductsQueryKey() });
      toast({
        title: isEdit ? t("seller.products.updated") : t("seller.products.created"),
      });
      setOpen(false);
    };
    const onError = () =>
      toast({ title: t("seller.products.saveError"), variant: "destructive" });

    if (isEdit && product) {
      update.mutate({ id: product.id, data }, { onSuccess, onError });
    } else {
      create.mutate({ data }, { onSuccess, onError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {isEdit ? t("seller.products.editTitle") : t("seller.products.addTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="p-name">{t("seller.products.name")}</Label>
            <Input
              id="p-name"
              value={name}
              maxLength={160}
              onChange={(e) => setName(e.target.value)}
              data-testid="product-name"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("seller.products.category")}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger data-testid="product-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {t(`marketplace.categories.${c}`, { defaultValue: c })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-unit">{t("seller.products.unit")}</Label>
              <Input
                id="p-unit"
                value={unit}
                maxLength={40}
                placeholder={t("seller.products.unitPlaceholder")}
                onChange={(e) => setUnit(e.target.value)}
                data-testid="product-unit"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="p-price">{t("seller.products.price")}</Label>
              <Input
                id="p-price"
                type="number"
                min={0}
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(e.target.value)}
                data-testid="product-price"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-stock">{t("seller.products.stock")}</Label>
              <Input
                id="p-stock"
                type="number"
                min={0}
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                data-testid="product-stock"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="p-desc">{t("seller.products.description")}</Label>
            <Textarea
              id="p-desc"
              value={description}
              rows={3}
              maxLength={2000}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="product-desc"
            />
          </div>

          <div className="space-y-2">
            <Label>{t("seller.products.photos")}</Label>
            <ImageUploader value={photos} onChange={setPhotos} />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="p-active">{t("seller.products.active")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("seller.products.activeHint")}
              </p>
            </div>
            <Switch
              id="p-active"
              checked={isActive}
              onCheckedChange={setIsActive}
              data-testid="product-active"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSave}
            disabled={pending}
            data-testid="product-save"
          >
            {pending ? t("seller.products.saving") : t("seller.products.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
