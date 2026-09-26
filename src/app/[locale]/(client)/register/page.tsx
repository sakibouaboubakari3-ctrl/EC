import { useTranslations } from 'next-intl';
import { registerAction } from './actions';
import { pageShellClass, cardClass, labelClass, inputClass, primaryButtonClass } from '@/lib/ui/classnames';

export default function RegisterPage() {
  const t = useTranslations();
  return (
    <main className={pageShellClass}>
      <div className={cardClass}>
        <h1 className="text-2xl font-bold text-[var(--color-navy)]">{t('auth.registerTitle')}</h1>
        <form action={registerAction} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="firstName" className={labelClass}>
              {t('auth.firstName')}
            </label>
            <input id="firstName" name="firstName" required className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="lastName" className={labelClass}>
              {t('auth.lastName')}
            </label>
            <input id="lastName" name="lastName" required className={inputClass} />
          </div>
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
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className={inputClass}
            />
          </div>
          <button type="submit" className={`mt-2 ${primaryButtonClass}`}>
            {t('auth.registerButton')}
          </button>
        </form>
      </div>
    </main>
  );
}
