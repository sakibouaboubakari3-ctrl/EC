import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { LoanSimulator } from '@/components/LoanSimulator';
import { ANNUAL_INTEREST_RATE } from '@/lib/config/loan';

export default function HomePage() {
  const t = useTranslations('home');

  return (
    <main>
      <section className="grid grid-cols-1 items-center gap-8 px-6 py-12 md:grid-cols-2 md:px-16 md:py-20">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-[var(--color-accent-deep)]">
            {t('hero.eyebrow')}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[var(--color-navy)] md:text-5xl">
            {t('hero.headline')}
          </h1>
          <p className="mt-4 text-lg text-[var(--color-navy)]/80">{t('hero.subheadline')}</p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/apply/loan-details"
              className="rounded-full bg-[var(--color-accent)] px-6 py-3 font-bold text-[var(--color-navy)]"
            >
              {t('hero.ctaPrimary')}
            </Link>
            <a
              href="#simulator"
              className="rounded-full border border-[var(--color-navy)] px-6 py-3 font-bold text-[var(--color-navy)]"
            >
              {t('hero.ctaSecondary')}
            </a>
          </div>
        </div>
        <div className="relative h-64 w-full overflow-hidden rounded-2xl md:h-96">
          <Image
            src="/media/home/hero.jpg"
            alt={t('hero.imageAlt')}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
            priority
          />
        </div>
      </section>

      <section className="bg-[var(--color-navy)]/[0.03] px-6 py-12 md:px-16">
        <h2 className="text-2xl font-bold text-[var(--color-navy)] md:text-3xl">{t('problem.title')}</h2>
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h3 className="font-bold text-[var(--color-navy)]">{t('problem.item1Title')}</h3>
            <p className="mt-2 text-[var(--color-navy)]/80">{t('problem.item1Body')}</p>
          </div>
          <div>
            <h3 className="font-bold text-[var(--color-navy)]">{t('problem.item2Title')}</h3>
            <p className="mt-2 text-[var(--color-navy)]/80">{t('problem.item2Body')}</p>
          </div>
          <div>
            <h3 className="font-bold text-[var(--color-navy)]">{t('problem.item3Title')}</h3>
            <p className="mt-2 text-[var(--color-navy)]/80">{t('problem.item3Body')}</p>
          </div>
        </div>
      </section>

      <section className="px-6 py-12 md:px-16">
        <h2 className="text-2xl font-bold text-[var(--color-navy)] md:text-3xl">{t('guide.title')}</h2>
        <p className="mt-4 max-w-3xl text-lg text-[var(--color-navy)]/80">{t('guide.body')}</p>
      </section>

      <section id="simulator" className="grid grid-cols-1 items-center gap-8 px-6 py-12 md:grid-cols-2 md:px-16">
        <div className="relative h-64 w-full overflow-hidden rounded-2xl md:h-96">
          <Image
            src="/media/home/plan.jpg"
            alt={t('plan.imageAlt')}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-navy)] md:text-3xl">{t('plan.title')}</h2>
          <ol className="mt-6 space-y-6">
            <li>
              <h3 className="font-bold text-[var(--color-navy)]">1. {t('plan.step1Title')}</h3>
              <p className="mt-1 text-[var(--color-navy)]/80">{t('plan.step1Body')}</p>
            </li>
            <li>
              <h3 className="font-bold text-[var(--color-navy)]">2. {t('plan.step2Title')}</h3>
              <p className="mt-1 text-[var(--color-navy)]/80">{t('plan.step2Body')}</p>
            </li>
            <li>
              <h3 className="font-bold text-[var(--color-navy)]">3. {t('plan.step3Title')}</h3>
              <p className="mt-1 text-[var(--color-navy)]/80">{t('plan.step3Body')}</p>
            </li>
          </ol>
        </div>
      </section>

      <section className="px-6 py-12 md:px-16">
        <LoanSimulator annualRate={ANNUAL_INTEREST_RATE} />
      </section>

      <section className="bg-[var(--color-navy)]/[0.03] px-6 py-12 text-center md:px-16">
        <h2 className="text-2xl font-bold text-[var(--color-navy)] md:text-3xl">{t('success.title')}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--color-navy)]/80">{t('success.body')}</p>
      </section>

      <section className="px-6 py-16 text-center md:px-16">
        <h2 className="text-2xl font-bold text-[var(--color-navy)] md:text-3xl">{t('finalCta.title')}</h2>
        <Link
          href="/apply/loan-details"
          className="mt-6 inline-block rounded-full bg-[var(--color-accent)] px-8 py-3 font-bold text-[var(--color-navy)]"
        >
          {t('finalCta.cta')}
        </Link>
      </section>
    </main>
  );
}
