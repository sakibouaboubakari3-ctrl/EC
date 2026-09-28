'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  MIN_LOAN_AMOUNT,
  MAX_LOAN_AMOUNT,
  LOAN_TERMS_MONTHS,
  DEFAULT_LOAN_AMOUNT,
  DEFAULT_TERM_MONTHS,
} from '@/lib/config/loan';
import { generateAmortizationSchedule } from '@/lib/amortization';
import { labelClass, inputClass } from '@/lib/ui/classnames';

export interface LoanSimulatorProps {
  initialAmount?: number;
  initialTermMonths?: number;
  annualRate: number;
  onChange?: (value: { amount: number; termMonths: number }) => void;
}

const currencyFormatter = new Intl.NumberFormat('fr-CA', {
  style: 'currency',
  currency: 'CAD',
  maximumFractionDigits: 0,
});

export function LoanSimulator({
  initialAmount = DEFAULT_LOAN_AMOUNT,
  initialTermMonths = DEFAULT_TERM_MONTHS,
  annualRate,
  onChange,
}: LoanSimulatorProps) {
  const t = useTranslations('simulator');
  const [amount, setAmount] = useState(initialAmount);
  const [termMonths, setTermMonths] = useState(initialTermMonths);

  function clamp(value: number): number {
    if (Number.isNaN(value)) return MIN_LOAN_AMOUNT;
    return Math.min(MAX_LOAN_AMOUNT, Math.max(MIN_LOAN_AMOUNT, value));
  }

  function updateAmount(value: number) {
    const clamped = clamp(value);
    setAmount(clamped);
    onChange?.({ amount: clamped, termMonths });
  }

  function updateTerm(value: number) {
    setTermMonths(value);
    onChange?.({ amount, termMonths: value });
  }

  const schedule = generateAmortizationSchedule(amount, termMonths, annualRate);
  const monthlyPayment = schedule[0]?.amount ?? 0;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm" data-testid="loan-simulator">
      <label htmlFor="amount-slider" className={labelClass}>
        {t('amountLabel')} — {`${currencyFormatter.format(MIN_LOAN_AMOUNT)} - ${currencyFormatter.format(MAX_LOAN_AMOUNT)}`}
      </label>
      <input
        id="amount-slider"
        aria-label="amount-slider"
        role="slider"
        type="range"
        min={MIN_LOAN_AMOUNT}
        max={MAX_LOAN_AMOUNT}
        step={5000}
        value={amount}
        onChange={(e) => updateAmount(Number(e.target.value))}
        className="mt-2 w-full accent-[var(--color-accent-deep)]"
      />
      <input
        id="amount-input"
        aria-label="amount-input"
        type="number"
        min={MIN_LOAN_AMOUNT}
        max={MAX_LOAN_AMOUNT}
        value={amount}
        onChange={(e) => updateAmount(Number(e.target.value))}
        onBlur={(e) => updateAmount(Number(e.target.value))}
        className={`mt-2 ${inputClass}`}
      />
      <label htmlFor="term-select" className={`mt-4 block ${labelClass}`}>
        {t('termLabel')}
      </label>
      <select
        id="term-select"
        aria-label="term-select"
        value={termMonths}
        onChange={(e) => updateTerm(Number(e.target.value))}
        className={`mt-2 ${inputClass}`}
      >
        {LOAN_TERMS_MONTHS.map((term) => (
          <option key={term} value={term}>
            {term}
          </option>
        ))}
      </select>
      <p className={`mt-4 ${labelClass}`}>{t('monthlyPayment')}</p>
      <p data-testid="monthly-payment" className="text-2xl font-bold text-[var(--color-navy)]">
        {currencyFormatter.format(monthlyPayment)}
      </p>
      <p className="mt-2 text-xs text-[var(--color-navy)]/60">{t('feeDisclosure')}</p>
    </div>
  );
}
