import { useTranslations } from 'next-intl';

export function SiteFooter() {
  const t = useTranslations('footer');

  return (
    <footer className="mt-16 border-t border-[var(--color-navy)]/10 px-6 py-8 text-sm text-[var(--color-navy)]/70">
      <p className="font-medium text-[var(--color-navy)]">{t('legalLine')}</p>
      <p>EspaceCredit Inc.</p>
      <p>62, rue du Petit-Champlain, Québec (Québec) G1K 4H4, Canada</p>
      <p>
        {t('neqLabel')} : 1198765432
      </p>
      <p className="mt-4">&copy; {new Date().getFullYear()} EspaceCredit Inc.</p>
    </footer>
  );
}
