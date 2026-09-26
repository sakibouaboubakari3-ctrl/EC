import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { staffLogoutAction } from '@/lib/auth/actions';

export interface AdminHeaderSession {
  user: { id: string };
}

export function AdminHeaderView({ session }: { session: AdminHeaderSession | null }) {
  const t = useTranslations('nav');

  return (
    <header className="flex items-center justify-between gap-4 bg-[var(--color-navy)] px-6 py-3 text-white">
      <div className="flex items-center gap-3">
        <Image src="/media/logo-symbol.png" alt="EspaceCredit" width={28} height={28} />
        <span className="font-semibold">{t('backOffice')}</span>
      </div>
      {session && (
        <form action={staffLogoutAction}>
          <button type="submit" className="text-sm underline">
            {t('logout')}
          </button>
        </form>
      )}
    </header>
  );
}
