import { describe, it, expect } from 'vitest';
import { renderLoanContractHtml } from '@/lib/contracts/contract-template';

const baseInput = {
  locale: 'fr' as const,
  clientName: 'Ada Lovelace',
  clientEmail: 'ada@example.com',
  clientAddress: '1 rue Principale, Montréal (Québec) H1A 1A1',
  amount: 100000,
  termMonths: 36,
  annualRate: 0.04,
  monthlyPayment: 2954.6,
  feeAmount: 5000,
  netAmount: 95000,
  companyRepName: 'Kenth Tremblay',
  companyRepTitle: 'Président-directeur général',
  companySignedAt: new Date('2026-09-26T00:00:00Z'),
  clientSignedAt: null,
};

describe('renderLoanContractHtml', () => {
  it('discloses the gross amount, fee, and net amount', () => {
    const html = renderLoanContractHtml(baseInput);
    expect(html).toContain('100');
    expect(html).toContain('5');
    expect(html).toContain('95');
  });

  it('names the company, its NEQ, and the executing representative as a text disclosure, not a signature image', () => {
    const html = renderLoanContractHtml(baseInput);
    expect(html).toContain('EspaceCredit Inc.');
    expect(html).toContain('1198765432');
    expect(html).toContain('Kenth Tremblay');
    expect(html).toContain('Président-directeur général');
    expect(html).not.toMatch(/<img[^>]*signature/i);
  });

  it('shows the client as not yet signed when clientSignedAt is null', () => {
    const html = renderLoanContractHtml(baseInput);
    expect(html).toMatch(/en attente/i);
  });

  it('shows the client signature date once signed', () => {
    const html = renderLoanContractHtml({
      ...baseInput,
      clientSignedAt: new Date('2026-09-27T00:00:00Z'),
    });
    expect(html).not.toMatch(/en attente/i);
    expect(html).toContain('Ada Lovelace');
  });

  it('mentions Quebec governing law', () => {
    const html = renderLoanContractHtml(baseInput);
    expect(html).toMatch(/québec/i);
  });

  it('renders in English when locale is en', () => {
    const html = renderLoanContractHtml({ ...baseInput, locale: 'en' });
    expect(html).toMatch(/loan agreement/i);
  });
});
