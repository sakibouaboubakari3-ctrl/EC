import { describe, it, expect, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { decideApplication, ForbiddenError, AlreadyDecidedError } from '@/lib/applications/decide';

describe('decideApplication', () => {
  const email = 'decide-test@example.com';
  const staffEmail = 'decide-test-staff@example.com';

  afterEach(async () => {
    const applications = await prisma.loanApplication.findMany({
      where: { client: { email } },
      select: { id: true },
    });
    await prisma.auditLog.deleteMany({ where: { entityId: { in: applications.map((a) => a.id) } } });
    await prisma.loanScheduleEntry.deleteMany({ where: { application: { client: { email } } } });
    await prisma.loanApplication.deleteMany({ where: { client: { email } } });
    await prisma.client.deleteMany({ where: { email } });
    await prisma.staffUser.deleteMany({ where: { email: staffEmail } });
  });

  async function seedStaff(role: 'AGENT' | 'SUPERVISOR' | 'ADMIN') {
    const staff = await prisma.staffUser.create({
      data: { email: staffEmail, passwordHash: 'x', name: 'Test Staff', role },
    });
    return staff.id;
  }

  async function seedSubmittedApplication() {
    const client = await prisma.client.create({
      data: { email, passwordHash: 'x', firstName: 'Grace', lastName: 'Hopper' },
    });
    return prisma.loanApplication.create({
      data: {
        clientId: client.id,
        amount: 6000,
        termMonths: 12,
        rate: 0.15,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });
  }

  it('forbids an AGENT from deciding', async () => {
    const application = await seedSubmittedApplication();
    await expect(
      decideApplication(prisma, {
        applicationId: application.id,
        staffId: 'staff-1',
        staffRole: 'AGENT',
        decision: 'APPROVED',
      })
    ).rejects.toThrow(ForbiddenError);
  });

  it('approves and generates a schedule for a SUPERVISOR', async () => {
    const application = await seedSubmittedApplication();
    const staffId = await seedStaff('SUPERVISOR');
    await decideApplication(prisma, {
      applicationId: application.id,
      staffId,
      staffRole: 'SUPERVISOR',
      decision: 'APPROVED',
    });

    const updated = await prisma.loanApplication.findUniqueOrThrow({ where: { id: application.id } });
    expect(updated.status).toBe('APPROVED');
    expect(updated.decidedByStaffId).toBe(staffId);

    const schedule = await prisma.loanScheduleEntry.findMany({ where: { applicationId: application.id } });
    expect(schedule).toHaveLength(12);
  });

  it('requires a reason to reject', async () => {
    const application = await seedSubmittedApplication();
    await expect(
      decideApplication(prisma, {
        applicationId: application.id,
        staffId: 'staff-1',
        staffRole: 'ADMIN',
        decision: 'REJECTED',
      })
    ).rejects.toThrow(/reason/i);
  });

  it('rejects with a reason and does not generate a schedule', async () => {
    const application = await seedSubmittedApplication();
    const staffId = await seedStaff('ADMIN');
    await decideApplication(prisma, {
      applicationId: application.id,
      staffId,
      staffRole: 'ADMIN',
      decision: 'REJECTED',
      reason: 'Insufficient income',
    });

    const updated = await prisma.loanApplication.findUniqueOrThrow({ where: { id: application.id } });
    expect(updated.status).toBe('REJECTED');
    expect(updated.decisionReason).toBe('Insufficient income');

    const schedule = await prisma.loanScheduleEntry.findMany({ where: { applicationId: application.id } });
    expect(schedule).toHaveLength(0);
  });

  it('forbids deciding an application that was already decided', async () => {
    const application = await seedSubmittedApplication();
    const staffId = await seedStaff('SUPERVISOR');
    await decideApplication(prisma, {
      applicationId: application.id,
      staffId,
      staffRole: 'SUPERVISOR',
      decision: 'APPROVED',
    });

    await expect(
      decideApplication(prisma, {
        applicationId: application.id,
        staffId,
        staffRole: 'SUPERVISOR',
        decision: 'APPROVED',
      })
    ).rejects.toThrow(AlreadyDecidedError);

    const schedule = await prisma.loanScheduleEntry.findMany({ where: { applicationId: application.id } });
    expect(schedule).toHaveLength(12);
  });
});
