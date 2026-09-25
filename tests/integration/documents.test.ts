import { describe, it, expect, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  createDocument,
  listDocumentsForApplication,
  getDocumentById,
  deleteDocument,
  replaceSingleTypeDocument,
  authorizeDocumentUpload,
  InvalidDocumentTypeError,
  ForbiddenError,
} from '@/lib/documents/documents';

describe('documents library', () => {
  const email = 'documents-lib-test@example.com';

  afterEach(async () => {
    await prisma.document.deleteMany({ where: { application: { client: { email } } } });
    await prisma.loanApplication.deleteMany({ where: { client: { email } } });
    await prisma.client.deleteMany({ where: { email } });
  });

  async function seedApplication() {
    const client = await prisma.client.create({
      data: { email, passwordHash: 'x', firstName: 'Test', lastName: 'User' },
    });
    return prisma.loanApplication.create({
      data: { clientId: client.id, amount: 100000, termMonths: 36, rate: 0.04, status: 'SUBMITTED' },
    });
  }

  it('creates and lists documents for an application', async () => {
    const application = await seedApplication();
    await createDocument(prisma, {
      applicationId: application.id,
      type: 'ID',
      storageKey: 'a/id.pdf',
      originalFilename: 'id.pdf',
      mimeType: 'application/pdf',
    });
    await createDocument(prisma, {
      applicationId: application.id,
      type: 'BANK_STATEMENT',
      storageKey: 'a/jan.pdf',
      originalFilename: 'january.pdf',
      mimeType: 'application/pdf',
    });

    const documents = await listDocumentsForApplication(prisma, application.id);
    expect(documents).toHaveLength(2);
  });

  it('deleteDocument is a no-op when the row does not exist', async () => {
    await expect(deleteDocument(prisma, 'nonexistent-id')).resolves.toBeUndefined();
  });

  it('getDocumentById returns null for a missing row', async () => {
    expect(await getDocumentById(prisma, 'nonexistent-id')).toBeNull();
  });

  it('replaceSingleTypeDocument removes prior ID documents and keeps the new one', async () => {
    const application = await seedApplication();
    const first = await createDocument(prisma, {
      applicationId: application.id,
      type: 'ID',
      storageKey: 'a/old-id.pdf',
      originalFilename: 'old-id.pdf',
      mimeType: 'application/pdf',
    });

    const { created, deleted } = await replaceSingleTypeDocument(prisma, {
      applicationId: application.id,
      type: 'ID',
      storageKey: 'a/new-id.pdf',
      originalFilename: 'new-id.pdf',
      mimeType: 'application/pdf',
    });

    expect(created.storageKey).toBe('a/new-id.pdf');
    expect(deleted.map((d) => d.id)).toEqual([first.id]);

    const remaining = await listDocumentsForApplication(prisma, application.id);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].storageKey).toBe('a/new-id.pdf');
  });

  it('replaceSingleTypeDocument does not touch BANK_STATEMENT documents of other types', async () => {
    const application = await seedApplication();
    await createDocument(prisma, {
      applicationId: application.id,
      type: 'BANK_STATEMENT',
      storageKey: 'a/jan.pdf',
      originalFilename: 'january.pdf',
      mimeType: 'application/pdf',
    });

    await replaceSingleTypeDocument(prisma, {
      applicationId: application.id,
      type: 'ID',
      storageKey: 'a/new-id.pdf',
      originalFilename: 'new-id.pdf',
      mimeType: 'application/pdf',
    });

    const remaining = await listDocumentsForApplication(prisma, application.id);
    expect(remaining).toHaveLength(2);
  });

  it('authorizeDocumentUpload rejects an invalid document type', async () => {
    const application = await seedApplication();
    await expect(
      authorizeDocumentUpload(prisma, {
        clientId: application.clientId,
        applicationId: application.id,
        type: 'SOMETHING_ELSE',
      })
    ).rejects.toThrow(InvalidDocumentTypeError);
  });

  it("authorizeDocumentUpload rejects a client uploading to another client's application", async () => {
    const application = await seedApplication();
    await expect(
      authorizeDocumentUpload(prisma, {
        clientId: 'a-different-client-id',
        applicationId: application.id,
        type: 'ID',
      })
    ).rejects.toThrow(ForbiddenError);
  });

  it('authorizeDocumentUpload resolves for a valid owner and type', async () => {
    const application = await seedApplication();
    await expect(
      authorizeDocumentUpload(prisma, {
        clientId: application.clientId,
        applicationId: application.id,
        type: 'ID',
      })
    ).resolves.toBeUndefined();
  });
});
