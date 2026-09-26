'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { signContractAction } from '@/app/[locale]/(client)/dashboard/actions';

export function ContractSignForm({ applicationId }: { applicationId: string }) {
  const t = useTranslations('contract');
  const [agreed, setAgreed] = useState(false);

  return (
    <form action={signContractAction.bind(null, applicationId)} className="mt-4">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          required
        />
        {t('agree')}
      </label>
      <button
        type="submit"
        disabled={!agreed}
        className="mt-3 rounded-full bg-[var(--color-accent)] px-6 py-2 font-bold text-[var(--color-navy)] disabled:opacity-40"
      >
        {t('sign')}
      </button>
    </form>
  );
}
