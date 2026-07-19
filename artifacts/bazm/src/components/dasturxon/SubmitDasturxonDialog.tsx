import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import {
  useCreateDasturxon,
  getListDasturxonQueryKey,
  getGetDasturxonStatsQueryKey,
  getListMyDasturxonQueryKey,
  getGetDasturxonComparisonQueryKey,
  type CityOption,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ImageUploader } from "@/components/ImageUploader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useDasturxonI18n, SUGGESTED_DISHES } from "./useDasturxonI18n";

const CITIES: CityOption[] = ["Tashkent", "Samarkand", "Bukhara", "Other"];

type ItemRow = { itemName: string; quantity: string; approxCost: string };

const emptyRow = (): ItemRow => ({ itemName: "", quantity: "", approxCost: "" });

/** Post-wedding form: submit your own dasturxon, optionally shared anonymously. */
export function SubmitDasturxonDialog({ trigger }: { trigger: ReactNode }) {
  const { t, dishLabel } = useDasturxonI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const [city, setCity] = useState<CityOption>("Tashkent");
  const [guestCount, setGuestCount] = useState("");
  const [totalSpent, setTotalSpent] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [items, setItems] = useState<ItemRow[]>([emptyRow()]);
  const [photos, setPhotos] = useState<string[]>([]);

  const create = useCreateDasturxon();

  const reset = () => {
    setCity("Tashkent");
    setGuestCount("");
    setTotalSpent("");
    setIsPublic(true);
    setItems([emptyRow()]);
    setPhotos([]);
  };

  const addSuggestion = (name: string) => {
    setItems((prev) => {
      if (prev.some((r) => r.itemName.toLowerCase() === name.toLowerCase())) {
        return prev;
      }
      // Fill the first empty row, otherwise append.
      const idx = prev.findIndex((r) => r.itemName.trim() === "");
      const next = [...prev];
      if (idx >= 0) {
        next[idx] = { ...next[idx], itemName: name };
      } else {
        next.push({ ...emptyRow(), itemName: name });
      }
      return next;
    });
  };

  const updateRow = (i: number, patch: Partial<ItemRow>) =>
    setItems((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const removeRow = (i: number) =>
    setItems((prev) =>
      prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev,
    );

  const handleSubmit = () => {
    const guests = Number(guestCount);
    const total = Number(totalSpent);
    const cleanItems = items
      .map((r) => ({
        itemName: r.itemName.trim(),
        quantity: Number(r.quantity) || 0,
        approxCost: r.approxCost.trim() === "" ? undefined : Number(r.approxCost),
      }))
      .filter((r) => r.itemName.length > 0);

    if (
      !Number.isFinite(guests) ||
      guests < 1 ||
      !Number.isFinite(total) ||
      total < 0 ||
      cleanItems.length === 0 ||
      photos.length < 2
    ) {
      toast({ title: t("dasturxon.submit.invalid"), variant: "destructive" });
      return;
    }

    create.mutate(
      {
        data: {
          city,
          guestCount: Math.floor(guests),
          totalSpentOnFood: Math.round(total),
          photos,
          isPublic,
          items: cleanItems.map((r) => ({
            itemName: r.itemName,
            quantity: Math.max(0, Math.floor(r.quantity)),
            ...(r.approxCost !== undefined && Number.isFinite(r.approxCost)
              ? { approxCost: Math.max(0, Math.round(r.approxCost)) }
              : {}),
          })),
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDasturxonQueryKey() });
          queryClient.invalidateQueries({
            queryKey: getGetDasturxonStatsQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getListMyDasturxonQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getGetDasturxonComparisonQueryKey(),
          });
          toast({ title: t("dasturxon.submit.success") });
          reset();
          setOpen(false);
        },
        onError: () =>
          toast({ title: t("dasturxon.submit.error"), variant: "destructive" }),
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {t("dasturxon.submit.title")}
          </DialogTitle>
          <DialogDescription>{t("dasturxon.submit.subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("dasturxon.submit.city")}</Label>
              <Select
                value={city}
                onValueChange={(v) => setCity(v as CityOption)}
              >
                <SelectTrigger data-testid="dx-submit-city">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {t(`budget.cities.${c}`, { defaultValue: c })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dx-guests">{t("dasturxon.submit.guestCount")}</Label>
              <Input
                id="dx-guests"
                type="number"
                min={1}
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                data-testid="dx-submit-guests"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dx-total">{t("dasturxon.submit.totalSpend")}</Label>
            <Input
              id="dx-total"
              type="number"
              min={0}
              value={totalSpent}
              onChange={(e) => setTotalSpent(e.target.value)}
              data-testid="dx-submit-total"
            />
          </div>

          <div className="space-y-2">
            <Label>{t("dasturxon.submit.items")}</Label>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_DISHES.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => addSuggestion(d.itemName)}
                  data-testid={`dx-suggest-${d.key}`}
                >
                  <Badge
                    variant="outline"
                    className="cursor-pointer font-normal hover:bg-secondary"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    {dishLabel(d.itemName)}
                  </Badge>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {items.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    className="flex-1"
                    placeholder={t("dasturxon.submit.itemName")}
                    value={row.itemName}
                    maxLength={80}
                    onChange={(e) => updateRow(i, { itemName: e.target.value })}
                    data-testid={`dx-item-name-${i}`}
                  />
                  <Input
                    className="w-20"
                    type="number"
                    min={0}
                    placeholder={t("dasturxon.submit.qty")}
                    value={row.quantity}
                    onChange={(e) => updateRow(i, { quantity: e.target.value })}
                    data-testid={`dx-item-qty-${i}`}
                  />
                  <Input
                    className="w-28"
                    type="number"
                    min={0}
                    placeholder={t("dasturxon.submit.cost")}
                    value={row.approxCost}
                    onChange={(e) => updateRow(i, { approxCost: e.target.value })}
                    data-testid={`dx-item-cost-${i}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => removeRow(i)}
                    aria-label={t("dasturxon.submit.removeItem")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setItems((prev) => [...prev, emptyRow()])}
              data-testid="dx-add-item"
            >
              <Plus className="mr-1 h-4 w-4" />
              {t("dasturxon.submit.addItem")}
            </Button>
          </div>

          <div className="space-y-2">
            <Label>{t("dasturxon.submit.photos")}</Label>
            <ImageUploader value={photos} onChange={setPhotos} max={12} />
            {photos.length < 2 && (
              <p className="text-xs text-muted-foreground" data-testid="dx-photos-hint">
                {t("dasturxon.submit.photosHint")}
              </p>
            )}
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
            <Switch
              id="dx-public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
              data-testid="dx-submit-public"
            />
            <div>
              <Label htmlFor="dx-public" className="cursor-pointer">
                {t("dasturxon.submit.makePublic")}
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("dasturxon.submit.anonNote")}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("dasturxon.submit.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={create.isPending || photos.length < 2}
            data-testid="dx-submit-save"
          >
            {create.isPending
              ? t("dasturxon.submit.saving")
              : t("dasturxon.submit.share")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
