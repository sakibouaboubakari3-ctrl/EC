'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { LoanSimulator } from '@/components/LoanSimulator';
import { StepProgress } from '@/components/StepProgress';
import { ANNUAL_INTEREST_RATE, DEFAULT_LOAN_AMOUNT, DEFAULT_TERM_MONTHS } from '@/lib/config/loan';
import { saveStepAction } from '../actions';
import { pageShellClass, wideCardClass, primaryButtonClass } from '@/lib/ui/classnames';

export function LoanDetailsForm({ applicationId }: { applicationId: string }) {
  const t = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState({ amount: DEFAULT_LOAN_AMOUNT, termMonths: DEFAULT_TERM_MONTHS });

  function handleNext() {
    startTransition(async () => {
      await saveStepAction(applicationId, value);
      router.push('/apply/personal');
    });
  }

  return (
    <main className={pageShellClass}>
      <div className={wideCardClass}>
        <StepProgress
          steps={[
            t('apply.stepLoanDetails'),
            t('apply.stepPersonalInfo'),
            t('apply.stepEmployment'),
            t('apply.stepReview'),
          ]}
          currentStep={0}
        />
        <LoanSimulator
          initialAmount={value.amount}
          initialTermMonths={value.termMonths}
          annualRate={ANNUAL_INTEREST_RATE}
          onChange={setValue}
        />
        <button
          type="button"
          onClick={handleNext}
          disabled={isPending}
          className={`mt-6 ${primaryButtonClass}`}
        >
          {t('common.next')}
        </button>
      </div>
    </main>
  );
}
