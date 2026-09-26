import { describe, it, expect, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  signContract,
  ForbiddenError,
  NotApprovedError,
  AlreadySignedError,
} from '@/lib/contracts/sign-contract';

describe('signContract', () => {
  const email = 'sign-contract-test@example.com';

  afterEach(async () => {
    await prisma.loanApplication.deleteMany({ where: { client: { email } } });
    await prisma.client.deleteMany({ where: { email } });
  });

  async function seedApplication(status: 'SUBMITTED' | 'APPROVED') {
    const client = await prisma.client.create({
      data: { email, passwordHash: 'x', firstName: 'Ada', lastName: 'Lovelace' },
    });
    const application = await prisma.loanApplication.create({
      data: {
        clientId: client.id,
        amount: 100000,
        termMonths: 36,
        rate: 0.04,
        status,
        decidedAt: status === 'APPROVED' ? new Date() : null,
      },
    });
    return { client, application };
  }

  it('signs an approved application and schedules the disbursement', async () => {
    const { client, application } = await seedApplication('APPROVED');

    await signContract(prisma, { applicationId: application.id, clientId: client.id });

    const updated = await prisma.loanApplication.findUniqueOrThrow({ where: { id: application.id } });
    expect(updated.contractSignedAt).not.toBeNull();
    expect(updated.disbursementScheduledAt).not.toBeNull();
    expect(updated.disbursementScheduledAt!.getTime()).toBeGreaterThan(updated.contractSignedAt!.getTime());
  });

  it('records an audit log entry', async () => {
    const { client, application } = await seedApplication('APPROVED');
    await signContract(prisma, { applicationId: application.id, clientId: client.id });

    const logs = await prisma.auditLog.findMany({ where: { entityId: application.id } });
    expect(logs.map((l) => l.action)).toContain('CONTRACT_SIGNED');
  });

  it("rejects signing another client's application", async () => {
    const { application } = await seedApplication('APPROVED');
    await expect(
      signContract(prisma, { applicationId: application.id, clientId: 'someone-else' })
    ).rejects.toThrow(ForbiddenError);
  });

  it('rejects signing an application that is not approved', async () => {
    const { client, application } = await seedApplication('SUBMITTED');
    await expect(
      signContract(prisma, { applicationId: application.id, clientId: client.id })
    ).rejects.toThrow(NotApprovedError);
  });

  it('rejects signing a contract twice', async () => {
    const { client, application } = await seedApplication('APPROVED');
    await signContract(prisma, { applicationId: application.id, clientId: client.id });
    await expect(
      signContract(prisma, { applicationId: application.id, clientId: client.id })
    ).rejects.toThrow(AlreadySignedError);
  });
});
