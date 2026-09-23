import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { verifyStaffCredentials } from '@/lib/auth/verify-staff';

describe('verifyStaffCredentials', () => {
  const email = 'staff-verify-test@example.com';

  beforeEach(async () => {
    await prisma.staffUser.create({
      data: {
        email,
        passwordHash: await hashPassword('Sup3rSecret!'),
        name: 'Test Staff',
        role: 'SUPERVISOR',
      },
    });
  });

  afterEach(async () => {
    await prisma.staffUser.deleteMany({ where: { email } });
  });

  it('returns the staff user for correct credentials', async () => {
    const staff = await verifyStaffCredentials(prisma, email, 'Sup3rSecret!');
    expect(staff?.role).toBe('SUPERVISOR');
  });

  it('returns null for an incorrect password', async () => {
    expect(await verifyStaffCredentials(prisma, email, 'WrongPassword')).toBeNull();
  });
});
