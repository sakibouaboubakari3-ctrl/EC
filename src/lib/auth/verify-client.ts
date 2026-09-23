import type { PrismaClient, Client } from '@prisma/client';
import { verifyPassword } from '@/lib/password';

export async function verifyClientCredentials(
  prisma: PrismaClient,
  email: string,
  password: string
): Promise<Client | null> {
  const client = await prisma.client.findUnique({ where: { email } });
  if (!client) return null;
  const valid = await verifyPassword(password, client.passwordHash);
  return valid ? client : null;
}
