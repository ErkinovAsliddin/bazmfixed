import {
  Users,
  Store,
  Package,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import {
  useAdminGetStats,
  getAdminGetStatsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatUZS } from "@/lib/format";

function StatCard({
  icon,
  label,
  value,
  testId,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  testId: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <div
            className="font-serif text-2xl font-bold text-foreground"
            data-testid={testId}
          >
            {value}
          </div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminOverview() {
  const { data: stats, isLoading } = useAdminGetStats({
    query: { queryKey: getAdminGetStatsQueryKey(), retry: false },
  });

  if (isLoading || !stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/50" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        icon={<Users className="h-5 w-5" />}
        label="Users"
        value={String(stats.totalUsers)}
        testId="stat-users"
      />
      <StatCard
        icon={<Store className="h-5 w-5" />}
        label="Vendors"
        value={String(stats.totalVendors)}
        testId="stat-vendors"
      />
      <StatCard
        icon={<Package className="h-5 w-5" />}
        label="Products"
        value={String(stats.totalProducts)}
        testId="stat-products"
      />
      <StatCard
        icon={<ShoppingBag className="h-5 w-5" />}
        label="Orders"
        value={String(stats.totalOrders)}
        testId="stat-orders"
      />
      <StatCard
        icon={<TrendingUp className="h-5 w-5" />}
        label="GMV (excl. cancelled)"
        value={formatUZS(stats.totalGmv, "en")}
        testId="stat-gmv"
      />
    </div>
  );
}
