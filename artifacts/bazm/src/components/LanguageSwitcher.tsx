import { useTranslation } from 'react-i18next';
import Cookies from 'js-cookie';
import { Button } from '@/components/ui/button';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng);
    Cookies.set('bazm_locale', lng, { expires: 365 });
  };

  const languages = ['uz', 'ru', 'en'];

  return (
    <div className="flex items-center gap-1">
      {languages.map((lng) => (
        <Button
          key={lng}
          variant={i18n.language === lng ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 px-2 text-xs font-semibold uppercase rounded-full transition-colors"
          onClick={() => handleLanguageChange(lng)}
          data-testid={`btn-lang-${lng}`}
        >
          {lng}
        </Button>
      ))}
    </div>
  );
}
