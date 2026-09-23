import { describe, it, expect, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { listApplications } from '@/lib/applications/list';

describe('listApplications', () => {
  const email = 'list-test@example.com';

  afterAll(async () => {
    await prisma.loanApplication.deleteMany({ where: { client: { email } } });
    await prisma.client.deleteMany({ where: { email } });
  });

  it('filters by status and paginates', async () => {
    const client = await prisma.client.create({
      data: { email, passwordHash: 'x', firstName: 'Grace', lastName: 'Hopper' },
    });
    await prisma.loanApplication.create({
      data: { clientId: client.id, amount: 3000, termMonths: 12, rate: 0.15, status: 'SUBMITTED' },
    });
    await prisma.loanApplication.create({
      data: { clientId: client.id, amount: 9000, termMonths: 24, rate: 0.15, status: 'APPROVED' },
    });

    const submittedOnly = await listApplications(prisma, { status: 'SUBMITTED' });
    expect(submittedOnly.applications.every((a) => a.status === 'SUBMITTED')).toBe(true);
    expect(submittedOnly.applications.some((a) => a.client.email === email)).toBe(true);

    const page = await listApplications(prisma, { pageSize: 1, page: 1 });
    expect(page.applications).toHaveLength(1);
  });
});
