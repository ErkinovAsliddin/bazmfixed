import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useGetCurrentUser, useLogoutUser, getGetCurrentUserQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, User as UserIcon } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useEffect } from 'react';

export function DashboardPage() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: user, isError, isLoading } = useGetCurrentUser({ 
    query: { 
      queryKey: getGetCurrentUserQueryKey(), 
      retry: false 
    } 
  });

  const logoutUser = useLogoutUser();

  useEffect(() => {
    // If we're done loading and there's an error (401), redirect to login
    if (!isLoading && isError) {
      setLocation('/login');
    }
  }, [isError, isLoading, setLocation]);

  const handleLogout = () => {
    logoutUser.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        setLocation('/');
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse w-12 h-12 rounded-full bg-primary/20"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) return null; // handled by useEffect redirect

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* User Greeting Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <h1 className="text-4xl font-serif font-bold text-foreground mb-2">
                Xush kelibsiz, {user.name}
              </h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                <span className="capitalize">{user.role}</span> account
              </p>
            </div>
            
            <Button variant="outline" onClick={handleLogout} className="w-full md:w-auto">
              <LogOut className="w-4 h-4 mr-2" /> Chiqish
            </Button>
          </div>

          {/* Placeholder Content */}
          <div className="bg-card border rounded-3xl p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-secondary/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <LayoutDashboard className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-4">
              {t('common.comingSoon')}
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              {t('common.comingSoonDescription')}
            </p>
            
            <div className="mt-8 pt-8 border-t border-border max-w-md mx-auto">
              <p className="text-sm text-muted-foreground mb-4">
                Sizning akkauntingiz muvaffaqiyatli yaratildi. Tez orada bu yerda to'y rejalashtirish asboblarini ko'rasiz.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}