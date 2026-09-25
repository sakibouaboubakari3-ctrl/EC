import { describe, it, expect, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getOrCreateDraftApplication, saveApplicationStep } from '@/lib/applications/draft';

describe('draft application', () => {
  const email = 'draft-test@example.com';

  afterEach(async () => {
    await prisma.loanApplication.deleteMany({ where: { client: { email } } });
    await prisma.client.deleteMany({ where: { email } });
  });

  it('creates a draft on first call and reuses it on the next', async () => {
    const client = await prisma.client.create({
      data: { email, passwordHash: 'x', firstName: 'Ada', lastName: 'Lovelace' },
    });
    const first = await getOrCreateDraftApplication(prisma, client.id);
    const second = await getOrCreateDraftApplication(prisma, client.id);
    expect(first.id).toBe(second.id);
    expect(first.status).toBe('DRAFT');
  });

  it('merges step data into formData without dropping earlier fields', async () => {
    const client = await prisma.client.create({
      data: { email, passwordHash: 'x', firstName: 'Ada', lastName: 'Lovelace' },
    });
    const application = await getOrCreateDraftApplication(prisma, client.id);
    await saveApplicationStep(prisma, application.id, { amount: 80000, termMonths: 12 });
    const updated = await saveApplicationStep(prisma, application.id, { firstName: 'Ada' });
    expect(updated.formData).toEqual({ amount: 80000, termMonths: 12, firstName: 'Ada' });
  });
});
