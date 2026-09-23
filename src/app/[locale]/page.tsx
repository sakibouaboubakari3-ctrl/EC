import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations();
  return (
    <main className="p-8">
      <h1 className="font-[family-name:var(--font-serif)] text-3xl text-[var(--color-navy)]">
        {t('home.title')}
      </h1>
    </main>
  );
}
