import { useTranslation } from 'react-i18next';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Construction } from 'lucide-react';

export function ComingSoonPage({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-24 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 bg-secondary/30 rounded-full flex items-center justify-center mx-auto mb-8">
            <Construction className="w-12 h-12 text-primary" />
          </div>
          
          <h1 className="text-3xl font-serif font-bold text-foreground mb-4">
            {t(titleKey)}
          </h1>
          
          <div className="bg-card border rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-foreground mb-3">
              {t('common.comingSoon')}
            </h2>
            <p className="text-muted-foreground">
              {t('common.comingSoonDescription')}
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}