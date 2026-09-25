import { describe, it, expect } from 'vitest';
import { loanAmountSchema, applicationFormSchema } from '@/lib/validation/loan';

describe('loanAmountSchema', () => {
  it('accepts amounts within bounds', () => {
    expect(loanAmountSchema.safeParse(20000).success).toBe(true);
    expect(loanAmountSchema.safeParse(500000).success).toBe(true);
    expect(loanAmountSchema.safeParse(100000).success).toBe(true);
  });

  it('rejects amounts outside bounds', () => {
    expect(loanAmountSchema.safeParse(19999).success).toBe(false);
    expect(loanAmountSchema.safeParse(500001).success).toBe(false);
  });
});

describe('applicationFormSchema', () => {
  const validForm = {
    amount: 100000,
    termMonths: 36,
    firstName: 'Ada',
    lastName: 'Lovelace',
    dateOfBirth: '1990-01-01',
    address: '1 rue Principale',
    city: 'Montréal',
    postalCode: 'H1A 1A1',
    employerName: 'Acme Inc.',
    monthlyIncome: 4000,
    employmentStatus: 'EMPLOYED',
  };

  it('accepts a fully valid form', () => {
    expect(applicationFormSchema.safeParse(validForm).success).toBe(true);
  });

  it('rejects a form missing required fields', () => {
    const { firstName, ...incomplete } = validForm;
    expect(applicationFormSchema.safeParse(incomplete).success).toBe(false);
  });
});
