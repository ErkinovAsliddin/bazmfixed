import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

const VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  confirmed: "default",
  fulfilled: "outline",
  cancelled: "destructive",
};

/** Localised badge for an order status, shared by buyer/seller/admin views. */
export function OrderStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  return (
    <Badge variant={VARIANTS[status] ?? "outline"} data-testid={`status-${status}`}>
      {t(`orders.status.${status}`, { defaultValue: status })}
    </Badge>
  );
}
