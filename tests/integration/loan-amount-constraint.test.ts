import { describe, it, expect, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';

describe('LoanApplication amount constraint', () => {
  const email = 'constraint-test@example.com';

  afterEach(async () => {
    await prisma.loanApplication.deleteMany({ where: { client: { email } } });
    await prisma.client.deleteMany({ where: { email } });
  });

  it('rejects an amount below 2000', async () => {
    const client = await prisma.client.create({
      data: { email, passwordHash: 'x', firstName: 'Test', lastName: 'User' },
    });
    await expect(
      prisma.loanApplication.create({
        data: { clientId: client.id, amount: 1000, termMonths: 12, rate: 0.15 },
      })
    ).rejects.toThrow();
  });

  it('accepts an amount within 2000-20000', async () => {
    const client = await prisma.client.create({
      data: { email, passwordHash: 'x', firstName: 'Test', lastName: 'User' },
    });
    const application = await prisma.loanApplication.create({
      data: { clientId: client.id, amount: 5000, termMonths: 12, rate: 0.15 },
    });
    expect(application.amount).toBe(5000);
  });
});
