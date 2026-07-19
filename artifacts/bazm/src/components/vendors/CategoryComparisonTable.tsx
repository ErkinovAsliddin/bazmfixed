import { Link } from "wouter";
import { BadgeCheck, SearchX } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import type { ComparisonTier } from "@workspace/api-client-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useVendorI18n } from "./useVendorI18n";

/**
 * Every vendor's tiers for one category in a single unified table. Rows are
 * pre-sorted/filtered by the page; `showEstimated` toggles the guest-based
 * estimated-cost column.
 */
export function CategoryComparisonTable({
  rows,
  showEstimated,
}: {
  rows: ComparisonTier[];
  showEstimated: boolean;
}) {
  const { t, fmt, tierLabel, unitLabel, cityLabel } = useVendorI18n();

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border">
        <EmptyState
          data-testid="comparison-empty"
          compact
          icon={SearchX}
          title={t("vendors.comparison.empty")}
          description={t("empty.comparisonDesc")}
        />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("vendors.comparison.vendor")}</TableHead>
            <TableHead>{t("vendors.comparison.tier")}</TableHead>
            <TableHead className="text-right">
              {t("vendors.comparison.unitPrice")}
            </TableHead>
            {showEstimated && (
              <TableHead className="text-right">
                {t("vendors.comparison.estCost")}
              </TableHead>
            )}
            <TableHead className="text-right sr-only">
              {t("vendors.comparison.action")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.tierId}
              data-testid={`comparison-row-${row.tierId}`}
            >
              <TableCell>
                <Link
                  href={`/vendors/${row.vendorId}`}
                  className="font-medium text-foreground hover:text-primary"
                >
                  <span className="inline-flex items-center gap-1">
                    {row.vendorName}
                    {row.isVerified && (
                      <BadgeCheck className="h-4 w-4 text-primary" />
                    )}
                  </span>
                </Link>
                <div className="text-xs text-muted-foreground">
                  {cityLabel(row.vendorCity)}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="font-normal">
                  {tierLabel(row.tierName)}
                </Badge>
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                <div className="font-medium text-foreground">
                  {fmt(row.pricePerUnit)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {unitLabel(row.unitType)}
                </div>
              </TableCell>
              {showEstimated && (
                <TableCell className="text-right whitespace-nowrap font-semibold text-primary">
                  {row.estimatedCost != null ? fmt(row.estimatedCost) : "—"}
                </TableCell>
              )}
              <TableCell className="text-right">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/vendors/${row.vendorId}`}>
                    {t("vendors.comparison.viewVendor")}
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
