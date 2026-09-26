import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';
import { clientLogoutAction } from '@/lib/auth/actions';

export interface SiteHeaderSession {
  user: { id: string };
}

export function SiteHeaderView({ session }: { session: SiteHeaderSession | null }) {
  const t = useTranslations('nav');

  return (
    <header className="flex items-center justify-between gap-4 border-b border-[var(--color-navy)]/10 px-6 py-4">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/media/logo-symbol.png" alt="" width={36} height={36} priority />
        <span className="text-lg font-bold text-[var(--color-navy)]">EspaceCredit</span>
      </Link>
      <nav className="flex items-center gap-6">
        {session ? (
          <>
            <Link href="/dashboard" className="text-sm font-medium">
              {t('dashboard')}
            </Link>
            <form action={clientLogoutAction}>
              <button type="submit" className="text-sm font-medium">
                {t('logout')}
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="text-sm font-medium">
              {t('login')}
            </Link>
            <Link
              href="/apply/loan-details"
              className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-bold text-[var(--color-navy)]"
            >
              {t('applyNow')}
            </Link>
          </>
        )}
        <LocaleSwitcher />
      </nav>
    </header>
  );
}
