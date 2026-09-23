import { useTranslations } from 'next-intl';
import { registerAction } from './actions';

export default function RegisterPage() {
  const t = useTranslations();
  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="font-[family-name:var(--font-serif)] text-2xl text-[var(--color-navy)]">
        {t('auth.registerTitle')}
      </h1>
      <form action={registerAction} className="mt-6 flex flex-col gap-4">
        <label htmlFor="firstName">{t('auth.firstName')}</label>
        <input id="firstName" name="firstName" required />
        <label htmlFor="lastName">{t('auth.lastName')}</label>
        <input id="lastName" name="lastName" required />
        <label htmlFor="email">{t('auth.email')}</label>
        <input id="email" name="email" type="email" required />
        <label htmlFor="password">{t('auth.password')}</label>
        <input id="password" name="password" type="password" required minLength={8} />
        <button
          type="submit"
          className="mt-2 rounded-full bg-[var(--color-accent)] px-6 py-2 font-bold text-[var(--color-navy)]"
        >
          {t('auth.registerButton')}
        </button>
      </form>
    </main>
  );
}
