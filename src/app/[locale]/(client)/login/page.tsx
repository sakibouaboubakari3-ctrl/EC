import { useTranslations } from 'next-intl';
import { clientLoginAction } from './actions';

export default function LoginPage() {
  const t = useTranslations();
  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="font-[family-name:var(--font-serif)] text-2xl text-[var(--color-navy)]">
        {t('auth.loginTitle')}
      </h1>
      <form action={clientLoginAction} className="mt-6 flex flex-col gap-4">
        <label htmlFor="email">{t('auth.email')}</label>
        <input id="email" name="email" type="email" required />
        <label htmlFor="password">{t('auth.password')}</label>
        <input id="password" name="password" type="password" required />
        <button
          type="submit"
          className="mt-2 rounded-full bg-[var(--color-accent)] px-6 py-2 font-bold text-[var(--color-navy)]"
        >
          {t('auth.loginButton')}
        </button>
      </form>
    </main>
  );
}
