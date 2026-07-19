import { useQueryClient } from "@tanstack/react-query";
import {
  useAdminListVendors,
  getAdminListVendorsQueryKey,
  useAdminUpdateVendor,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

export function AdminVendorsTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: vendors, isLoading } = useAdminListVendors({
    query: { queryKey: getAdminListVendorsQueryKey(), retry: false },
  });
  const update = useAdminUpdateVendor();

  const patch = (id: number, data: { isVerified?: boolean; isActive?: boolean }) => {
    update.mutate(
      { id, data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getAdminListVendorsQueryKey(),
          });
        },
        onError: () =>
          toast({ title: "Failed to update vendor", variant: "destructive" }),
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
              <TableHead>Business</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Products</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(vendors ?? []).map((v) => (
              <TableRow key={v.id} data-testid={`admin-vendor-${v.id}`}>
                <TableCell className="font-medium text-foreground">
                  {v.businessName}
                  <div className="text-xs text-muted-foreground">{v.city}</div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {v.ownerName ?? "—"}
                  {v.ownerEmail && (
                    <div className="text-xs">{v.ownerEmail}</div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{v.category}</Badge>
                </TableCell>
                <TableCell className="text-right">{v.productCount}</TableCell>
                <TableCell>
                  <Switch
                    checked={v.isVerified}
                    onCheckedChange={(c) => patch(v.id, { isVerified: c })}
                    aria-label="Verified"
                    data-testid={`vendor-verified-${v.id}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={v.isActive}
                      onCheckedChange={(c) => patch(v.id, { isActive: c })}
                      aria-label="Active"
                      data-testid={`vendor-active-${v.id}`}
                    />
                    {!v.isActive && (
                      <Label className="text-xs text-destructive">Suspended</Label>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
