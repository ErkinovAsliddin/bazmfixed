import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t py-12 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="font-serif text-3xl font-bold text-primary tracking-tight block mb-4">
              Bazm
            </Link>
            <p className="text-muted-foreground max-w-sm">
              {t('footer.tagline')}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Platform</h4>
            <ul className="space-y-2">
              <li><Link href="/budget" className="text-muted-foreground hover:text-primary transition-colors">{t('nav.budget')}</Link></li>
              <li><Link href="/vendors" className="text-muted-foreground hover:text-primary transition-colors">{t('nav.vendors')}</Link></li>
              <li><Link href="/marketplace" className="text-muted-foreground hover:text-primary transition-colors">{t('nav.marketplace')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Account</h4>
            <ul className="space-y-2">
              <li><Link href="/login" className="text-muted-foreground hover:text-primary transition-colors">{t('nav.login')}</Link></li>
              <li><Link href="/register" className="text-muted-foreground hover:text-primary transition-colors">{t('auth.login.goRegister')}</Link></li>
              <li><Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">{t('nav.dashboard')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; {currentYear} Bazm. {t('footer.rights')}</p>
        </div>
      </div>
    </footer>
  );
}