import { useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateMyVendorTier,
  useUpdateMyVendorTier,
  getGetMyVendorQueryKey,
  type VendorTier,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useVendorI18n } from "./useVendorI18n";
import { ImageUploader } from "@/components/ImageUploader";

const UNIT_TYPES = ["per_guest", "per_event", "per_day", "flat"] as const;

/** Create or edit one of the signed-in vendor's own tiers. */
export function VendorTierDialog({
  tier,
  trigger,
}: {
  tier?: VendorTier;
  trigger: ReactNode;
}) {
  const { t, unitLabel } = useVendorI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const [tierName, setTierName] = useState("");
  const [price, setPrice] = useState("");
  const [unitType, setUnitType] =
    useState<(typeof UNIT_TYPES)[number]>("per_event");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  const create = useCreateMyVendorTier();
  const update = useUpdateMyVendorTier();
  const isPending = create.isPending || update.isPending;

  // Reset the form to the editing target each time the dialog opens.
  useEffect(() => {
    if (open) {
      setTierName(tier?.tierName ?? "");
      setPrice(tier ? String(tier.pricePerUnit) : "");
      setUnitType(tier?.unitType ?? "per_event");
      setDescription(tier?.description ?? "");
      setPhotos(tier?.photos ?? []);
    }
  }, [open, tier]);

  const handleSave = () => {
    const priceNum = Number(price);
    if (tierName.trim().length === 0 || !Number.isFinite(priceNum) || priceNum < 0) {
      toast({ title: t("vendors.dashboard.invalidTier"), variant: "destructive" });
      return;
    }

    const data = {
      tierName: tierName.trim(),
      pricePerUnit: Math.round(priceNum),
      unitType,
      description: description.trim() || null,
      photos,
    };

    const onSuccess = () => {
      queryClient.invalidateQueries({ queryKey: getGetMyVendorQueryKey() });
      toast({ title: t("vendors.dashboard.tierSaved") });
      setOpen(false);
    };
    const onError = () =>
      toast({ title: t("vendors.dashboard.saveError"), variant: "destructive" });

    if (tier) {
      update.mutate({ tierId: tier.id, data }, { onSuccess, onError });
    } else {
      create.mutate({ data }, { onSuccess, onError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif">
            {tier
              ? t("vendors.dashboard.editTier")
              : t("vendors.dashboard.newTier")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tier-name">{t("vendors.dashboard.tierName")}</Label>
            <Input
              id="tier-name"
              value={tierName}
              maxLength={60}
              onChange={(e) => setTierName(e.target.value)}
              data-testid="tier-name-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tier-price">{t("vendors.dashboard.price")}</Label>
              <Input
                id="tier-price"
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                data-testid="tier-price-input"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("vendors.dashboard.unit")}</Label>
              <Select
                value={unitType}
                onValueChange={(v) =>
                  setUnitType(v as (typeof UNIT_TYPES)[number])
                }
              >
                <SelectTrigger data-testid="tier-unit-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_TYPES.map((u) => (
                    <SelectItem key={u} value={u}>
                      {unitLabel(u)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tier-desc">
              {t("vendors.dashboard.tierDescription")}
            </Label>
            <Textarea
              id="tier-desc"
              value={description}
              rows={3}
              maxLength={500}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="tier-desc-input"
            />
          </div>

          <div className="space-y-2">
            <Label>{t("vendors.dashboard.tierPhotos")}</Label>
            <ImageUploader value={photos} onChange={setPhotos} max={6} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("vendors.dashboard.cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending}
            data-testid="tier-save"
          >
            {isPending
              ? t("vendors.dashboard.saving")
              : t("vendors.dashboard.saveTier")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
