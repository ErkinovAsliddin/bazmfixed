import { useState } from "react";
import { Phone } from "lucide-react";
import { useCreateVendorInquiry } from "@workspace/api-client-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useVendorI18n } from "./useVendorI18n";

/**
 * Reveals a vendor's phone number, but only after logging an inquiry via the
 * API (the phone is never sent to the client until the inquiry POST succeeds).
 */
export function ContactVendorButton({
  vendorId,
  vendorName,
  size,
  variant,
  className,
}: {
  vendorId: number;
  vendorName: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  className?: string;
}) {
  const { t } = useVendorI18n();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState<string | null>(null);
  const inquiry = useCreateVendorInquiry();

  const revealed = phone !== null;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      // Reset for the next time the dialog is opened.
      setMessage("");
      setPhone(null);
      inquiry.reset();
    }
  };

  const handleSend = () => {
    const trimmed = message.trim();
    inquiry.mutate(
      { id: vendorId, data: { message: trimmed || undefined } },
      {
        onSuccess: (res) => {
          if (res.phone) {
            setPhone(res.phone);
          } else {
            toast({
              title: t("vendors.contact.noPhone"),
              variant: "destructive",
            });
          }
        },
        onError: () =>
          toast({ title: t("vendors.contact.error"), variant: "destructive" }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size={size}
          variant={variant}
          className={className}
          data-testid="contact-vendor-button"
        >
          <Phone className="h-4 w-4" />
          {t("vendors.contact.button")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif">
            {revealed
              ? t("vendors.contact.phoneRevealed")
              : t("vendors.contact.dialogTitle", { name: vendorName })}
          </DialogTitle>
          <DialogDescription>
            {revealed
              ? t("vendors.contact.phoneRevealedDesc")
              : t("vendors.contact.dialogDesc")}
          </DialogDescription>
        </DialogHeader>

        {revealed ? (
          <a
            href={`tel:${phone}`}
            className="flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 py-4 font-serif text-2xl font-bold text-primary"
            data-testid="revealed-phone"
          >
            <Phone className="h-5 w-5" />
            {phone}
          </a>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="inquiry-message">
              {t("vendors.contact.message")}
            </Label>
            <Textarea
              id="inquiry-message"
              value={message}
              maxLength={500}
              rows={3}
              placeholder={t("vendors.contact.messagePlaceholder")}
              onChange={(e) => setMessage(e.target.value)}
              data-testid="inquiry-message"
            />
          </div>
        )}

        <DialogFooter>
          {revealed ? (
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              {t("vendors.contact.close")}
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={inquiry.isPending}
              data-testid="inquiry-send"
            >
              {inquiry.isPending
                ? t("vendors.contact.sending")
                : t("vendors.contact.send")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
