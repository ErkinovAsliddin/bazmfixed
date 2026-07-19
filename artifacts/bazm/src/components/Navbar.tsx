import { Link, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useGetCurrentUser, useLogoutUser, getGetCurrentUserQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: user } = useGetCurrentUser({ 
    query: { 
      queryKey: getGetCurrentUserQueryKey(), 
      retry: false 
    } 
  });
  
  const logoutUser = useLogoutUser();

  const handleLogout = () => {
    logoutUser.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        setLocation('/');
      }
    });
  };

  const navLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/budget', label: t('nav.budget') },
    { href: '/vendors', label: t('nav.vendors') },
    { href: '/dasturxon', label: t('nav.dasturxon') },
    { href: '/sufficiency', label: t('nav.sufficiency') },
    { href: '/marketplace', label: t('nav.marketplace') },
    ...(user ? [{ href: '/my-plans', label: t('nav.myPlans') }] : []),
    ...(user ? [{ href: '/orders', label: t('nav.myOrders') }] : []),
    ...(user?.role === 'vendor'
      ? [{ href: '/vendor-dashboard', label: t('nav.vendorDashboard') }]
      : []),
    ...(user?.role === 'organizer'
      ? [{ href: '/organizer-dashboard', label: t('nav.organizerDashboard') }]
      : []),
    ...(user?.role === 'admin'
      ? [{ href: '/admin', label: t('nav.admin') }]
      : []),
    { href: '/dashboard', label: t('nav.dashboard') },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-serif text-2xl font-bold text-primary tracking-tight">
            Bazm
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitcher />
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-foreground">{user.name}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                {t('nav.logout')}
              </Button>
            </div>
          ) : (
            <Button asChild size="sm" className="rounded-full px-6">
              <Link href="/login">{t('nav.login')}</Link>
            </Button>
          )}
        </div>

        <div className="md:hidden flex items-center gap-4">
          <LanguageSwitcher />
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background p-4 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className="text-sm font-medium text-foreground p-2 rounded-md hover:bg-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <Button variant="outline" className="w-full justify-start mt-2" onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>
              {t('nav.logout')}
            </Button>
          ) : (
            <Button asChild className="w-full justify-start mt-2" onClick={() => setMobileMenuOpen(false)}>
              <Link href="/login">{t('nav.login')}</Link>
            </Button>
          )}
        </div>
      )}
    </nav>
  );
}