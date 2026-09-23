import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { verifyClientCredentials } from '@/lib/auth/verify-client';

describe('verifyClientCredentials', () => {
  const email = 'verify-test@example.com';

  beforeEach(async () => {
    await prisma.client.create({
      data: {
        email,
        passwordHash: await hashPassword('Sup3rSecret!'),
        firstName: 'Ada',
        lastName: 'Lovelace',
      },
    });
  });

  afterEach(async () => {
    await prisma.client.deleteMany({ where: { email } });
  });

  it('returns the client for correct credentials', async () => {
    const client = await verifyClientCredentials(prisma, email, 'Sup3rSecret!');
    expect(client?.email).toBe(email);
  });

  it('returns null for an incorrect password', async () => {
    expect(await verifyClientCredentials(prisma, email, 'WrongPassword')).toBeNull();
  });

  it('returns null for an unknown email', async () => {
    expect(await verifyClientCredentials(prisma, 'nobody@example.com', 'x')).toBeNull();
  });
});
