import { useEffect } from "react";
import { useLocation } from "wouter";
import { ShieldCheck } from "lucide-react";
import {
  useGetCurrentUser,
  getGetCurrentUserQueryKey,
} from "@workspace/api-client-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { AdminVendorsTab } from "@/components/admin/AdminVendorsTab";
import { AdminProductsTab } from "@/components/admin/AdminProductsTab";
import { AdminOrdersTab } from "@/components/admin/AdminOrdersTab";
import { AdminUsersTab } from "@/components/admin/AdminUsersTab";

export default function AdminPage() {
  const [, setLocation] = useLocation();

  const {
    data: user,
    isLoading,
    isError,
  } = useGetCurrentUser({
    query: {
      queryKey: getGetCurrentUserQueryKey(),
      // Retry transient failures (network blips) but not auth failures, so a
      // momentary hiccup never wrongly bounces a legitimate admin to /login.
      retry: (failureCount, error) => {
        const status = (error as { response?: { status?: number } })?.response
          ?.status;
        if (status === 401 || status === 403) return false;
        return failureCount < 2;
      },
    },
  });

  useEffect(() => {
    if (!isLoading && isError) setLocation("/login");
  }, [isError, isLoading, setLocation]);

  const isAdmin = user?.role === "admin";

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 py-12">
        {user && !isAdmin ? (
          <Card className="mx-auto max-w-lg border-dashed">
            <CardContent className="p-12 text-center text-muted-foreground">
              You don't have access to the admin panel.
            </CardContent>
          </Card>
        ) : isAdmin ? (
          <>
            <header className="mb-8">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <ShieldCheck className="h-4 w-4" />
                Admin
              </div>
              <h1 className="mt-2 font-serif text-4xl font-bold text-foreground">
                Control Panel
              </h1>
              <p className="mt-2 text-muted-foreground">
                Manage vendors, products, orders and users across Bazm.
              </p>
            </header>

            <div className="mb-8">
              <AdminOverview />
            </div>

            <Tabs defaultValue="vendors" className="space-y-6">
              <TabsList>
                <TabsTrigger value="vendors" data-testid="admin-tab-vendors">
                  Vendors
                </TabsTrigger>
                <TabsTrigger value="products" data-testid="admin-tab-products">
                  Products
                </TabsTrigger>
                <TabsTrigger value="orders" data-testid="admin-tab-orders">
                  Orders
                </TabsTrigger>
                <TabsTrigger value="users" data-testid="admin-tab-users">
                  Users
                </TabsTrigger>
              </TabsList>
              <TabsContent value="vendors">
                <AdminVendorsTab />
              </TabsContent>
              <TabsContent value="products">
                <AdminProductsTab />
              </TabsContent>
              <TabsContent value="orders">
                <AdminOrdersTab />
              </TabsContent>
              <TabsContent value="users">
                <AdminUsersTab />
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="h-64 animate-pulse rounded-xl bg-muted/50" />
        )}
      </main>
      <Footer />
    </div>
  );
}
