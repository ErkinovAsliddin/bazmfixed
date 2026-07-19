import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import { LandingPage } from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import BudgetPlannerPage from '@/pages/BudgetPlannerPage';
import MyPlansPage from '@/pages/MyPlansPage';
import PlanDetailPage from '@/pages/PlanDetailPage';
import SharedPlanPage from '@/pages/SharedPlanPage';
import VendorsPage from '@/pages/VendorsPage';
import VendorDetailPage from '@/pages/VendorDetailPage';
import CategoryComparisonPage from '@/pages/CategoryComparisonPage';
import VendorDashboardPage from '@/pages/VendorDashboardPage';
import DasturxonPage from '@/pages/DasturxonPage';
import SufficiencyPage from '@/pages/SufficiencyPage';
import MarketplacePage from '@/pages/MarketplacePage';
import MyOrdersPage from '@/pages/MyOrdersPage';
import AdminPage from '@/pages/AdminPage';
import OrganizerDashboardPage from '@/pages/OrganizerDashboardPage';
import OrganizerClientDetailPage from '@/pages/OrganizerClientDetailPage';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartProvider } from '@/lib/cart';

const queryClient = new QueryClient();

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/dashboard" component={DashboardPage} />
      
      {/* Wedding Budget Planner */}
      <Route path="/budget" component={BudgetPlannerPage} />
      <Route path="/my-plans" component={MyPlansPage} />
      <Route path="/plans/:id" component={PlanDetailPage} />
      <Route path="/share/:token" component={SharedPlanPage} />

      {/* Vendor marketplace & comparison. The category route must precede
          the :id route so "category" is not matched as a vendor id. */}
      <Route path="/vendors" component={VendorsPage} />
      <Route path="/vendors/category/:category" component={CategoryComparisonPage} />
      <Route path="/vendors/:id" component={VendorDetailPage} />
      <Route path="/vendor-dashboard" component={VendorDashboardPage} />

      {/* Dasturxon comparison — real weddings, real spend */}
      <Route path="/dasturxon" component={DasturxonPage} />

      {/* Quantity sufficiency calculator — "will it be enough?" */}
      <Route path="/sufficiency" component={SufficiencyPage} />

      {/* Marketplace — physical wedding goods with a server-synced cart */}
      <Route path="/marketplace" component={MarketplacePage} />
      <Route path="/orders" component={MyOrdersPage} />

      {/* Admin control panel (role=admin) */}
      <Route path="/admin" component={AdminPage} />

      {/* Organizer dashboard — client roster, plans, and outreach. The detail
          route precedes so ":id" is captured, not matched as a sub-path. */}
      <Route path="/organizer-dashboard/clients/:id" component={OrganizerClientDetailPage} />
      <Route path="/organizer-dashboard" component={OrganizerDashboardPage} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CartProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
        </CartProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
