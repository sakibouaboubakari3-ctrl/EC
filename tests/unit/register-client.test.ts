import { describe, it, expect, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { registerClient, EmailAlreadyRegisteredError } from '@/lib/auth/register-client';

describe('registerClient', () => {
  const email = 'register-test@example.com';

  afterEach(async () => {
    await prisma.client.deleteMany({ where: { email } });
  });

  it('creates a client with a hashed password', async () => {
    const client = await registerClient(prisma, {
      email,
      password: 'Sup3rSecret!',
      firstName: 'Ada',
      lastName: 'Lovelace',
      locale: 'fr',
    });
    expect(client.email).toBe(email);
    expect(client.passwordHash).not.toBe('Sup3rSecret!');
  });

  it('rejects a duplicate email', async () => {
    await registerClient(prisma, {
      email,
      password: 'Sup3rSecret!',
      firstName: 'Ada',
      lastName: 'Lovelace',
      locale: 'fr',
    });
    await expect(
      registerClient(prisma, {
        email,
        password: 'Another1!',
        firstName: 'Ada',
        lastName: 'Lovelace',
        locale: 'fr',
      })
    ).rejects.toThrow(EmailAlreadyRegisteredError);
  });
});
