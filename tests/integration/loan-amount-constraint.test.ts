import { describe, it, expect, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';

describe('LoanApplication amount constraint', () => {
  const email = 'constraint-test@example.com';

  afterEach(async () => {
    await prisma.loanApplication.deleteMany({ where: { client: { email } } });
    await prisma.client.deleteMany({ where: { email } });
  });

  it('rejects an amount below 20000', async () => {
    const client = await prisma.client.create({
      data: { email, passwordHash: 'x', firstName: 'Test', lastName: 'User' },
    });
    await expect(
      prisma.loanApplication.create({
        data: { clientId: client.id, amount: 10000, termMonths: 12, rate: 0.04 },
      })
    ).rejects.toThrow();
  });

  it('rejects an amount above 500000', async () => {
    const client = await prisma.client.create({
      data: { email, passwordHash: 'x', firstName: 'Test', lastName: 'User' },
    });
    await expect(
      prisma.loanApplication.create({
        data: { clientId: client.id, amount: 600000, termMonths: 12, rate: 0.04 },
      })
    ).rejects.toThrow();
  });

  it('accepts an amount within 20000-500000', async () => {
    const client = await prisma.client.create({
      data: { email, passwordHash: 'x', firstName: 'Test', lastName: 'User' },
    });
    const application = await prisma.loanApplication.create({
      data: { clientId: client.id, amount: 100000, termMonths: 12, rate: 0.04 },
    });
    expect(application.amount).toBe(100000);
  });
});
