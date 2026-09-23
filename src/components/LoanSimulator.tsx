'use client';

import { useState } from 'react';
import { MIN_LOAN_AMOUNT, MAX_LOAN_AMOUNT, LOAN_TERMS_MONTHS } from '@/lib/config/loan';
import { generateAmortizationSchedule } from '@/lib/amortization';

export interface LoanSimulatorProps {
  initialAmount?: number;
  initialTermMonths?: number;
  annualRate: number;
  onChange?: (value: { amount: number; termMonths: number }) => void;
}

export function LoanSimulator({
  initialAmount = 5000,
  initialTermMonths = 12,
  annualRate,
  onChange,
}: LoanSimulatorProps) {
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
      <label htmlFor="amount-slider" className="font-[family-name:var(--font-serif)] text-lg text-[var(--color-navy)]">
        {`${MIN_LOAN_AMOUNT}-${MAX_LOAN_AMOUNT}`}
      </label>
      <input
        id="amount-slider"
        aria-label="amount-slider"
        role="slider"
        type="range"
        min={MIN_LOAN_AMOUNT}
        max={MAX_LOAN_AMOUNT}
        step={100}
        value={amount}
        onChange={(e) => updateAmount(Number(e.target.value))}
        className="w-full"
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
        className="mt-2 w-full rounded border px-3 py-2"
      />
      <select
        id="term-select"
        aria-label="term-select"
        value={termMonths}
        onChange={(e) => updateTerm(Number(e.target.value))}
        className="mt-2 w-full rounded border px-3 py-2"
      >
        {LOAN_TERMS_MONTHS.map((term) => (
          <option key={term} value={term}>
            {term}
          </option>
        ))}
      </select>
      <p data-testid="monthly-payment" className="mt-4 text-xl font-bold text-[var(--color-navy)]">
        {monthlyPayment.toFixed(2)}
      </p>
    </div>
  );
}
