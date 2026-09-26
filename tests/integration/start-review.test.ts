import { describe, it, expect, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { startReview, NotSubmittedError } from '@/lib/applications/start-review';

describe('startReview', () => {
  const email = 'start-review-test@example.com';
  const staffEmail = 'start-review-test-staff@example.com';

  afterEach(async () => {
    const applications = await prisma.loanApplication.findMany({
      where: { client: { email } },
      select: { id: true },
    });
    await prisma.auditLog.deleteMany({ where: { entityId: { in: applications.map((a) => a.id) } } });
    await prisma.loanApplication.deleteMany({ where: { client: { email } } });
    await prisma.client.deleteMany({ where: { email } });
    await prisma.staffUser.deleteMany({ where: { email: staffEmail } });
  });

  async function seedStaff() {
    const staff = await prisma.staffUser.create({
      data: { email: staffEmail, passwordHash: 'x', name: 'Test Staff', role: 'AGENT' },
    });
    return staff.id;
  }

  async function seedApplication(status: 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED') {
    const client = await prisma.client.create({
      data: { email, passwordHash: 'x', firstName: 'Grace', lastName: 'Hopper' },
    });
    return prisma.loanApplication.create({
      data: { clientId: client.id, amount: 60000, termMonths: 12, rate: 0.04, status },
    });
  }

  it('moves a SUBMITTED application to IN_REVIEW', async () => {
    const application = await seedApplication('SUBMITTED');
    const staffId = await seedStaff();

    await startReview(prisma, { applicationId: application.id, staffId });

    const updated = await prisma.loanApplication.findUniqueOrThrow({ where: { id: application.id } });
    expect(updated.status).toBe('IN_REVIEW');
  });

  it('records an audit log entry', async () => {
    const application = await seedApplication('SUBMITTED');
    const staffId = await seedStaff();

    await startReview(prisma, { applicationId: application.id, staffId });

    const logs = await prisma.auditLog.findMany({ where: { entityId: application.id } });
    expect(logs.map((l) => l.action)).toContain('APPLICATION_REVIEW_STARTED');
  });

  it('rejects an application that is not SUBMITTED', async () => {
    const application = await seedApplication('IN_REVIEW');
    const staffId = await seedStaff();

    await expect(startReview(prisma, { applicationId: application.id, staffId })).rejects.toThrow(
      NotSubmittedError
    );
  });
});
