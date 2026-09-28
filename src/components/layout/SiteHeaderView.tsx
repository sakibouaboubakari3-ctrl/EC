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
    <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-[var(--color-navy)]/10 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/media/logo-symbol.png" alt="" width={32} height={32} priority className="h-7 w-7 sm:h-9 sm:w-9" />
        <span className="text-base font-bold text-[var(--color-navy)] sm:text-lg">EspaceCredit</span>
      </Link>
      <nav className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:gap-6">
        {session ? (
          <>
            <Link href="/dashboard" className="text-xs font-medium sm:text-sm">
              {t('dashboard')}
            </Link>
            <form action={clientLogoutAction}>
              <button type="submit" className="text-xs font-medium sm:text-sm">
                {t('logout')}
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="text-xs font-medium sm:text-sm">
              {t('login')}
            </Link>
            <Link
              href="/apply/loan-details"
              className="rounded-full bg-[var(--color-accent)] px-3 py-1.5 text-xs font-bold text-[var(--color-navy)] sm:px-4 sm:py-2 sm:text-sm"
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
