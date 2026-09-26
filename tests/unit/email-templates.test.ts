import { describe, it, expect } from 'vitest';
import {
  renderApplicationSubmittedEmail,
  renderApplicationDecisionEmail,
  renderDepositScheduledEmail,
} from '@/lib/email/templates';

describe('renderApplicationSubmittedEmail', () => {
  it('includes the client name, amount, and brand colors in French', () => {
    const html = renderApplicationSubmittedEmail({
      locale: 'fr',
      clientName: 'Ada Lovelace',
      amount: 80000,
      appUrl: 'https://example.com',
    });
    expect(html).toContain('Ada Lovelace');
    expect(html).toContain('80');
    expect(html).toContain('#032551');
    expect(html).toContain('https://example.com/media/logo-symbol.png');
    expect(html).toMatch(/reçue|Reçue/);
  });

  it('renders in English when locale is en', () => {
    const html = renderApplicationSubmittedEmail({
      locale: 'en',
      clientName: 'Ada Lovelace',
      amount: 80000,
      appUrl: 'https://example.com',
    });
    expect(html).toMatch(/received/i);
  });
});

describe('renderApplicationDecisionEmail', () => {
  it('shows an approved message with the schedule link in French', () => {
    const html = renderApplicationDecisionEmail({
      locale: 'fr',
      clientName: 'Ada Lovelace',
      decision: 'APPROVED',
      reason: null,
      appUrl: 'https://example.com',
    });
    expect(html).toMatch(/approuvée/i);
    expect(html).toContain('https://example.com/fr/dashboard');
  });

  it('shows the rejection reason when rejected', () => {
    const html = renderApplicationDecisionEmail({
      locale: 'fr',
      clientName: 'Ada Lovelace',
      decision: 'REJECTED',
      reason: 'Insufficient income',
      appUrl: 'https://example.com',
    });
    expect(html).toMatch(/refusée/i);
    expect(html).toContain('Insufficient income');
  });
});

describe('renderDepositScheduledEmail', () => {
  it('shows the net amount and scheduled date in French', () => {
    const html = renderDepositScheduledEmail({
      locale: 'fr',
      clientName: 'Ada Lovelace',
      netAmount: 95000,
      scheduledDate: new Date('2026-09-28T00:00:00Z'),
      appUrl: 'https://example.com',
    });
    expect(html).toContain('95');
    expect(html).toMatch(/dépôt/i);
  });

  it('renders in English when locale is en', () => {
    const html = renderDepositScheduledEmail({
      locale: 'en',
      clientName: 'Ada Lovelace',
      netAmount: 95000,
      scheduledDate: new Date('2026-09-28T00:00:00Z'),
      appUrl: 'https://example.com',
    });
    expect(html).toMatch(/deposit/i);
  });
});
