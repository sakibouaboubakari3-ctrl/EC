import { describe, it, expect, vi } from 'vitest';
import { notifyApplicationSubmitted, notifyApplicationDecision } from '@/lib/email/notifications';
import type { EmailClient } from '@/lib/email/brevo-client';

function fakeClient(): { client: EmailClient; send: ReturnType<typeof vi.fn> } {
  const send = vi.fn().mockResolvedValue(undefined);
  return { client: { send }, send };
}

describe('notifyApplicationSubmitted', () => {
  it('sends to the client with a French subject', async () => {
    const { client, send } = fakeClient();
    await notifyApplicationSubmitted(client, {
      clientEmail: 'ada@example.com',
      clientName: 'Ada Lovelace',
      locale: 'fr',
      amount: 80000,
      appUrl: 'https://example.com',
    });
    expect(send).toHaveBeenCalledTimes(1);
    const call = send.mock.calls[0][0];
    expect(call.to).toEqual([{ email: 'ada@example.com', name: 'Ada Lovelace' }]);
    expect(call.subject).toMatch(/reçue/i);
    expect(call.htmlContent).toContain('Ada Lovelace');
  });
});

describe('notifyApplicationDecision', () => {
  it('sends an approval email', async () => {
    const { client, send } = fakeClient();
    await notifyApplicationDecision(client, {
      clientEmail: 'ada@example.com',
      clientName: 'Ada Lovelace',
      locale: 'fr',
      decision: 'APPROVED',
      reason: null,
      appUrl: 'https://example.com',
    });
    expect(send.mock.calls[0][0].subject).toMatch(/approuvé/i);
  });

  it('sends a rejection email with the reason embedded', async () => {
    const { client, send } = fakeClient();
    await notifyApplicationDecision(client, {
      clientEmail: 'ada@example.com',
      clientName: 'Ada Lovelace',
      locale: 'en',
      decision: 'REJECTED',
      reason: 'Insufficient income',
      appUrl: 'https://example.com',
    });
    expect(send.mock.calls[0][0].htmlContent).toContain('Insufficient income');
  });
});
