'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';

export function LocaleSwitcher() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const other = locale === 'fr' ? 'en' : 'fr';

  return (
    <Link href={pathname} locale={other} className="text-sm font-medium">
      {t('switchToLanguage')}
    </Link>
  );
}
