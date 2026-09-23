import type { PrismaClient } from '@prisma/client';
import { hashPassword } from '@/lib/password';

export interface RegisterClientInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  locale: 'fr' | 'en';
}

export class EmailAlreadyRegisteredError extends Error {}

export async function registerClient(prisma: PrismaClient, input: RegisterClientInput) {
  const existing = await prisma.client.findUnique({ where: { email: input.email } });
  if (existing) throw new EmailAlreadyRegisteredError();
  const passwordHash = await hashPassword(input.password);
  return prisma.client.create({
    data: {
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      locale: input.locale,
    },
  });
}
