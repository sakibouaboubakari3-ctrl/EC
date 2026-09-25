import { describe, it, expect, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';

describe('Document model', () => {
  const email = 'document-schema-test@example.com';

  afterEach(async () => {
    await prisma.document.deleteMany({ where: { application: { client: { email } } } });
    await prisma.loanApplication.deleteMany({ where: { client: { email } } });
    await prisma.client.deleteMany({ where: { email } });
  });

  it('creates a Document with the finalized fields', async () => {
    const client = await prisma.client.create({
      data: { email, passwordHash: 'x', firstName: 'Test', lastName: 'User' },
    });
    const application = await prisma.loanApplication.create({
      data: { clientId: client.id, amount: 100000, termMonths: 36, rate: 0.04, status: 'SUBMITTED' },
    });
    const document = await prisma.document.create({
      data: {
        applicationId: application.id,
        type: 'ID',
        storageKey: 'clients/abc/id.pdf',
        originalFilename: 'passport.pdf',
        mimeType: 'application/pdf',
      },
    });
    expect(document.type).toBe('ID');
    expect(document.originalFilename).toBe('passport.pdf');
    expect(document.mimeType).toBe('application/pdf');
  });
});
