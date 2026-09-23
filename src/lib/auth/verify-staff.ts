import type { PrismaClient, StaffUser } from '@prisma/client';
import { verifyPassword } from '@/lib/password';

export async function verifyStaffCredentials(
  prisma: PrismaClient,
  email: string,
  password: string
): Promise<StaffUser | null> {
  const staff = await prisma.staffUser.findUnique({ where: { email } });
  if (!staff) return null;
  const valid = await verifyPassword(password, staff.passwordHash);
  return valid ? staff : null;
}
