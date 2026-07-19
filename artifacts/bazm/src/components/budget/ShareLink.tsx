import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBudgetI18n } from "./useBudgetI18n";

/** Read-only share URL + copy button for a saved plan's family view. */
export function ShareLink({ token }: { token: string }) {
  const { t } = useBudgetI18n();
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}${import.meta.env.BASE_URL}share/${token}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may be unavailable; the input is selectable as a fallback */
    }
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Input
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className="bg-background text-sm"
      />
      <Button type="button" variant="outline" onClick={copy} className="shrink-0">
        {copied ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            {t("budget.actions.copied")}
          </>
        ) : (
          <>
            <Copy className="mr-2 h-4 w-4" />
            {t("budget.actions.copyLink")}
          </>
        )}
      </Button>
    </div>
  );
}
