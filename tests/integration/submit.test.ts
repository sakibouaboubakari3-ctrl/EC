import { describe, it, expect, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getOrCreateDraftApplication, saveApplicationStep } from '@/lib/applications/draft';
import { submitApplication } from '@/lib/applications/submit';

describe('submitApplication', () => {
  const email = 'submit-test@example.com';

  afterEach(async () => {
    await prisma.auditLog.deleteMany({ where: { actorId: { in: await clientIds() } } });
    await prisma.loanApplication.deleteMany({ where: { client: { email } } });
    await prisma.client.deleteMany({ where: { email } });
  });

  async function clientIds() {
    const clients = await prisma.client.findMany({ where: { email }, select: { id: true } });
    return clients.map((c) => c.id);
  }

  const validStepData = {
    amount: 8000,
    termMonths: 12,
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

  it('submits a fully filled application and logs an audit entry', async () => {
    const client = await prisma.client.create({
      data: { email, passwordHash: 'x', firstName: 'Ada', lastName: 'Lovelace' },
    });
    const application = await getOrCreateDraftApplication(prisma, client.id);
    await saveApplicationStep(prisma, application.id, validStepData);

    const result = await submitApplication(prisma, application.id);
    expect(result).toEqual({ ok: true });

    const updated = await prisma.loanApplication.findUniqueOrThrow({ where: { id: application.id } });
    expect(updated.status).toBe('SUBMITTED');
    expect(updated.amount).toBe(8000);
    expect(updated.submittedAt).not.toBeNull();

    const auditEntries = await prisma.auditLog.findMany({ where: { entityId: application.id } });
    expect(auditEntries).toHaveLength(1);
    expect(auditEntries[0].action).toBe('APPLICATION_SUBMITTED');
  });

  it('refuses to submit an incomplete application', async () => {
    const client = await prisma.client.create({
      data: { email, passwordHash: 'x', firstName: 'Ada', lastName: 'Lovelace' },
    });
    const application = await getOrCreateDraftApplication(prisma, client.id);
    await saveApplicationStep(prisma, application.id, { amount: 8000 });

    const result = await submitApplication(prisma, application.id);
    expect(result.ok).toBe(false);

    const unchanged = await prisma.loanApplication.findUniqueOrThrow({ where: { id: application.id } });
    expect(unchanged.status).toBe('DRAFT');

    const auditEntries = await prisma.auditLog.findMany({ where: { entityId: application.id } });
    expect(auditEntries).toHaveLength(0);
  });
});
