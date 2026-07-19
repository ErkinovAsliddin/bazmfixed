import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import {
  useCreateOrganizerClient,
  getListOrganizerClientsQueryKey,
  getGetOrganizerSummaryQueryKey,
} from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useOrganizerI18n } from "./useOrganizerI18n";

/** Dialog for adding a client manually, with optional couple-account linking. */
export function AddClientDialog() {
  const { t } = useOrganizerI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const create = useCreateOrganizerClient();

  const [open, setOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [shareToken, setShareToken] = useState("");
  const [notes, setNotes] = useState("");

  const reset = () => {
    setClientName("");
    setWeddingDate("");
    setShareToken("");
    setNotes("");
  };

  const handleSubmit = () => {
    if (clientName.trim().length === 0) {
      toast({ title: t("organizer.add.nameRequired"), variant: "destructive" });
      return;
    }
    create.mutate(
      {
        data: {
          clientName: clientName.trim(),
          weddingDate: weddingDate.trim() || null,
          shareToken: shareToken.trim() || null,
          notes: notes.trim() || null,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getListOrganizerClientsQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getGetOrganizerSummaryQueryKey(),
          });
          toast({ title: t("organizer.add.success") });
          reset();
          setOpen(false);
        },
        onError: () =>
          toast({ title: t("organizer.add.error"), variant: "destructive" }),
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button data-testid="add-client-trigger">
          <Plus className="h-4 w-4" />
          {t("organizer.add.button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {t("organizer.add.title")}
          </DialogTitle>
          <DialogDescription>{t("organizer.add.subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="client-name">
              {t("organizer.add.clientName")}
            </Label>
            <Input
              id="client-name"
              value={clientName}
              maxLength={120}
              onChange={(e) => setClientName(e.target.value)}
              placeholder={t("organizer.add.clientNamePlaceholder")}
              data-testid="client-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wedding-date">
              {t("organizer.add.weddingDate")}
            </Label>
            <Input
              id="wedding-date"
              type="date"
              value={weddingDate}
              onChange={(e) => setWeddingDate(e.target.value)}
              data-testid="wedding-date"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="share-token">
              {t("organizer.add.shareToken")}
            </Label>
            <Input
              id="share-token"
              value={shareToken}
              maxLength={200}
              onChange={(e) => setShareToken(e.target.value)}
              placeholder={t("organizer.add.shareTokenPlaceholder")}
              data-testid="share-token"
            />
            <p className="text-xs text-muted-foreground">
              {t("organizer.add.shareTokenHint")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-notes">{t("organizer.add.notes")}</Label>
            <Textarea
              id="client-notes"
              value={notes}
              rows={3}
              maxLength={2000}
              onChange={(e) => setNotes(e.target.value)}
              data-testid="client-notes"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={create.isPending}
          >
            {t("organizer.add.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={create.isPending}
            data-testid="client-submit"
          >
            {create.isPending
              ? t("organizer.add.saving")
              : t("organizer.add.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
