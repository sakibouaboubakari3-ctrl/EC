import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/password';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hashPassword('Sup3rSecret!');

  await prisma.staffUser.upsert({
    where: { email: 'agent@espacecredit.test' },
    update: {},
    create: { email: 'agent@espacecredit.test', passwordHash, name: 'Test Agent', role: 'AGENT' },
  });

  await prisma.staffUser.upsert({
    where: { email: 'supervisor@espacecredit.test' },
    update: {},
    create: {
      email: 'supervisor@espacecredit.test',
      passwordHash,
      name: 'Test Supervisor',
      role: 'SUPERVISOR',
    },
  });

  await prisma.staffUser.upsert({
    where: { email: 'admin@espacecredit.test' },
    update: {},
    create: { email: 'admin@espacecredit.test', passwordHash, name: 'Test Admin', role: 'ADMIN' },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
