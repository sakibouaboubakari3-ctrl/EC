import { useTranslations } from 'next-intl';
import { staffLoginAction } from './actions';
import { pageShellClass, cardClass, labelClass, inputClass, primaryButtonClass } from '@/lib/ui/classnames';

export default function StaffLoginPage() {
  const t = useTranslations();
  return (
    <main className={pageShellClass}>
      <div className={cardClass}>
        <h1 className="text-2xl font-bold text-[var(--color-navy)]">{t('auth.loginTitle')}</h1>
        <form action={staffLoginAction} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className={labelClass}>
              {t('auth.email')}
            </label>
            <input id="email" name="email" type="email" required className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className={labelClass}>
              {t('auth.password')}
            </label>
            <input id="password" name="password" type="password" required className={inputClass} />
          </div>
          <button type="submit" className={`mt-2 ${primaryButtonClass}`}>
            {t('auth.loginButton')}
          </button>
        </form>
      </div>
    </main>
  );
}
