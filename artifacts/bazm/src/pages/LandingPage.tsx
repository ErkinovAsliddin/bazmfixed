import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import {
  ArrowRight,
  Calculator,
  Users,
  Utensils,
  LayoutDashboard,
  Wallet,
  Scale,
  CalendarCheck,
  BadgeCheck,
  HeartHandshake,
  ShieldCheck,
  Languages,
  Building2,
  UtensilsCrossed,
  Flower2,
  Music,
  Camera,
  Shirt,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SuzaniDivider } from '@/components/SuzaniDivider';
import heroImg from '@assets/generated_images/bazm-hero.jpg';
import feastImg from '@assets/generated_images/bazm-feast.jpg';
import decorImg from '@assets/generated_images/bazm-decor.jpg';

export function LandingPage() {
  const { t } = useTranslation();

  const stats = [
    t('landing.stats.categories', { returnObjects: true }) as { value: string; label: string },
    t('landing.stats.pricing', { returnObjects: true }) as { value: string; label: string },
    t('landing.stats.fees', { returnObjects: true }) as { value: string; label: string },
    t('landing.stats.anytime', { returnObjects: true }) as { value: string; label: string },
  ];

  const steps = [
    { icon: Wallet, key: 'step1' },
    { icon: Scale, key: 'step2' },
    { icon: CalendarCheck, key: 'step3' },
  ] as const;

  const features = [
    { icon: Calculator, key: 'budget', tint: 'bg-secondary/30 text-primary' },
    { icon: Users, key: 'marketplace', tint: 'bg-accent/20 text-accent' },
    { icon: Utensils, key: 'dasturxon', tint: 'bg-primary/10 text-primary' },
    { icon: LayoutDashboard, key: 'organizer', tint: 'bg-secondary/50 text-secondary-foreground' },
  ] as const;

  const categories = [
    { icon: Building2, key: 'venue' },
    { icon: UtensilsCrossed, key: 'catering' },
    { icon: Flower2, key: 'decor' },
    { icon: Music, key: 'music' },
    { icon: Camera, key: 'photography' },
    { icon: Shirt, key: 'clothing' },
  ] as const;

  const values = [
    { icon: BadgeCheck, key: 'v1' },
    { icon: HeartHandshake, key: 'v2' },
    { icon: ShieldCheck, key: 'v3' },
    { icon: Languages, key: 'v4' },
  ] as const;

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0 suzani-field opacity-40" aria-hidden="true" />
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-secondary/20 via-background to-background" />
        <div className="container relative z-10 mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="page-fade text-center lg:text-left">
              <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-secondary/40 border border-secondary text-secondary-foreground text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                {t('landing.badge')}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground mb-6 leading-[1.1]">
                {t('app.tagline')}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-9 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {t('landing.heroSubtitle')}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Button asChild size="lg" className="rounded-full px-8 h-14 text-base w-full sm:w-auto shadow-lg hover-elevate-2 press">
                  <Link href="/register" data-testid="hero-cta">
                    {t('hero.cta')} <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full px-8 h-14 text-base w-full sm:w-auto border-2 border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/40">
                  <Link href="/vendors" data-testid="hero-secondary-cta">
                    {t('landing.heroSecondary')}
                  </Link>
                </Button>
              </div>
            </div>

            <div className="relative page-fade">
              <div className="suzani-ribbon absolute -inset-3 rounded-[2rem] opacity-60" aria-hidden="true" />
              <div className="relative overflow-hidden rounded-[1.75rem] ring-1 ring-accent/30 shadow-2xl">
                <img
                  src={heroImg}
                  alt=""
                  className="aspect-[4/5] w-full object-cover sm:aspect-[5/4] lg:aspect-[4/5]"
                  loading="eager"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-primary/40 to-transparent" />
              </div>
              <div className="absolute -bottom-5 left-1/2 hidden -translate-x-1/2 rounded-2xl border border-border bg-background/95 px-5 py-3 shadow-xl backdrop-blur sm:flex sm:items-center sm:gap-3 lg:-left-6 lg:translate-x-0">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10">
                  <HeartHandshake className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">{t('landing.values.v2.title')}</p>
                  <p className="text-xs text-muted-foreground">{t('app.tagline')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stat strip */}
          <div className="mt-16 grid grid-cols-2 gap-4 md:mt-20 md:grid-cols-4">
            {stats.map((s, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border/60 bg-card/70 px-4 py-5 text-center backdrop-blur"
              >
                <p className="font-serif text-3xl font-bold text-primary md:text-4xl">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
              {t('landing.how.title')}
            </h2>
            <p className="mt-4 text-muted-foreground">{t('landing.how.subtitle')}</p>
            <SuzaniDivider className="mt-6" />
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {steps.map(({ icon: Icon, key }, i) => (
              <div key={key} className="relative text-center">
                <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <span className="mb-2 block font-serif text-sm font-bold text-accent">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mb-2 font-serif text-xl font-bold text-foreground">
                  {t(`landing.how.${key}.title`)}
                </h3>
                <p className="mx-auto max-w-xs text-muted-foreground leading-relaxed">
                  {t(`landing.how.${key}.desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-24 bg-card border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="mb-14 text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
              {t('features.sectionTitle')}
            </h2>
            <SuzaniDivider className="mt-6" />
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
            {features.map(({ icon: Icon, key, tint }) => (
              <div
                key={key}
                className="group relative overflow-hidden rounded-3xl border border-border/50 bg-background p-8 shadow-sm hover-elevate card-lift"
              >
                <div className="absolute right-0 top-0 p-8 opacity-5 transition-opacity group-hover:opacity-10">
                  <Icon className="h-24 w-24 text-primary" />
                </div>
                <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${tint}`}>
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="mb-3 font-serif text-2xl font-bold">{t(`features.${key}.title`)}</h3>
                <p className="leading-relaxed text-muted-foreground">
                  {t(`features.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="relative order-last lg:order-first">
              <div className="suzani-ribbon absolute -inset-3 rounded-[2rem] opacity-50" aria-hidden="true" />
              <img
                src={decorImg}
                alt=""
                className="relative aspect-[5/4] w-full rounded-[1.75rem] object-cover shadow-xl ring-1 ring-accent/30"
                loading="lazy"
              />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
                {t('landing.categories.title')}
              </h2>
              <p className="mt-4 text-muted-foreground">{t('landing.categories.subtitle')}</p>
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {categories.map(({ icon: Icon, key }) => (
                  <Link
                    key={key}
                    href="/vendors"
                    className="flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card/60 px-4 py-5 text-center transition-colors hover:border-accent hover:bg-accent/5"
                    data-testid={`category-${key}`}
                  >
                    <Icon className="h-6 w-6 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      {t(`landing.categories.${key}`)}
                    </span>
                  </Link>
                ))}
              </div>
              <Button asChild variant="ghost" className="mt-6 px-0 text-primary hover:bg-transparent hover:text-primary/80">
                <Link href="/vendors">
                  {t('landing.categories.cta')} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 md:py-24 bg-card border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="mb-14 text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
              {t('landing.values.title')}
            </h2>
            <SuzaniDivider className="mt-6" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(({ icon: Icon, key }) => (
              <div
                key={key}
                className="rounded-3xl border border-border/50 bg-background p-7 text-center shadow-sm card-lift"
              >
                <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-secondary/30">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-2 font-serif text-lg font-bold text-foreground">
                  {t(`landing.values.${key}.title`)}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(`landing.values.${key}.desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seller CTA */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-[2rem] border border-border/60 shadow-xl">
            <img src={feastImg} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-primary/50" />
            <div className="relative z-10 max-w-xl px-8 py-14 md:px-14 md:py-20">
              <span className="inline-block rounded-full bg-accent/25 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-foreground">
                {t('landing.sellers.badge')}
              </span>
              <h2 className="mt-5 font-serif text-3xl md:text-4xl font-bold text-primary-foreground">
                {t('landing.sellers.title')}
              </h2>
              <p className="mt-4 text-primary-foreground/85 leading-relaxed">
                {t('landing.sellers.desc')}
              </p>
              <Button asChild size="lg" variant="secondary" className="mt-8 rounded-full px-8 h-14 press">
                <Link href="/register" data-testid="seller-cta">
                  {t('landing.sellers.cta')} <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-primary py-24">
        <div className="suzani-field absolute inset-0 opacity-20" aria-hidden="true" />
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-accent opacity-20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-secondary opacity-20 blur-3xl" />
        <div className="container relative z-10 mx-auto px-4 text-center">
          <h2 className="mx-auto max-w-2xl font-serif text-3xl md:text-5xl font-bold text-primary-foreground">
            {t('landing.finalTitle')}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-primary-foreground/85">
            {t('landing.finalSubtitle')}
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-10 rounded-full px-10 h-14 text-lg press">
            <Link href="/register">{t('hero.cta')}</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
