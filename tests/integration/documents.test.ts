import { describe, it, expect, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  createDocument,
  listDocumentsForApplication,
  getDocumentById,
  deleteDocument,
  replaceSingleTypeDocument,
  authorizeDocumentUpload,
  confirmDocumentUpload,
  authorizeDocumentDeletion,
  InvalidDocumentTypeError,
  ForbiddenError,
  ApplicationNotMutableError,
} from '@/lib/documents/documents';
import type { ApplicationStatus } from '@prisma/client';

describe('documents library', () => {
  const email = 'documents-lib-test@example.com';

  afterEach(async () => {
    await prisma.document.deleteMany({ where: { application: { client: { email } } } });
    await prisma.loanApplication.deleteMany({ where: { client: { email } } });
    await prisma.client.deleteMany({ where: { email } });
  });

  async function seedApplication(status: ApplicationStatus = 'SUBMITTED') {
    const client = await prisma.client.create({
      data: { email, passwordHash: 'x', firstName: 'Test', lastName: 'User' },
    });
    return prisma.loanApplication.create({
      data: { clientId: client.id, amount: 100000, termMonths: 36, rate: 0.04, status },
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

  it('authorizeDocumentUpload resolves for an IN_REVIEW application', async () => {
    const application = await seedApplication('IN_REVIEW');
    await expect(
      authorizeDocumentUpload(prisma, {
        clientId: application.clientId,
        applicationId: application.id,
        type: 'ID',
      })
    ).resolves.toBeUndefined();
  });

  it('authorizeDocumentUpload rejects once the application has been decided', async () => {
    const application = await seedApplication('APPROVED');
    await expect(
      authorizeDocumentUpload(prisma, {
        clientId: application.clientId,
        applicationId: application.id,
        type: 'ID',
      })
    ).rejects.toThrow(ApplicationNotMutableError);
  });

  describe('confirmDocumentUpload', () => {
    it('creates the document row and reports no deletions for a first upload', async () => {
      const application = await seedApplication();
      const result = await confirmDocumentUpload(prisma, {
        clientId: application.clientId,
        applicationId: application.id,
        type: 'ID',
        storageKey: `applications/${application.id}/ID/passport.pdf`,
        originalFilename: 'passport.pdf',
        mimeType: 'application/pdf',
      });
      expect(result.created.storageKey).toBe(`applications/${application.id}/ID/passport.pdf`);
      expect(result.deletedStorageKeys).toEqual([]);
    });

    it('replaces a prior ID document and reports its storage key for cleanup', async () => {
      const application = await seedApplication();
      await createDocument(prisma, {
        applicationId: application.id,
        type: 'ID',
        storageKey: `applications/${application.id}/ID/old.pdf`,
        originalFilename: 'old.pdf',
        mimeType: 'application/pdf',
      });

      const result = await confirmDocumentUpload(prisma, {
        clientId: application.clientId,
        applicationId: application.id,
        type: 'ID',
        storageKey: `applications/${application.id}/ID/new.pdf`,
        originalFilename: 'new.pdf',
        mimeType: 'application/pdf',
      });

      expect(result.deletedStorageKeys).toEqual([`applications/${application.id}/ID/old.pdf`]);
    });

    it('rejects a storageKey outside the expected applicationId/type prefix', async () => {
      const application = await seedApplication();
      await expect(
        confirmDocumentUpload(prisma, {
          clientId: application.clientId,
          applicationId: application.id,
          type: 'ID',
          storageKey: `applications/some-other-application/ID/passport.pdf`,
          originalFilename: 'passport.pdf',
          mimeType: 'application/pdf',
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('rejects confirming an upload for another client\'s application', async () => {
      const application = await seedApplication();
      await expect(
        confirmDocumentUpload(prisma, {
          clientId: 'a-different-client-id',
          applicationId: application.id,
          type: 'ID',
          storageKey: `applications/${application.id}/ID/passport.pdf`,
          originalFilename: 'passport.pdf',
          mimeType: 'application/pdf',
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('rejects confirming an upload once the application has been decided', async () => {
      const application = await seedApplication('APPROVED');
      await expect(
        confirmDocumentUpload(prisma, {
          clientId: application.clientId,
          applicationId: application.id,
          type: 'ID',
          storageKey: `applications/${application.id}/ID/passport.pdf`,
          originalFilename: 'passport.pdf',
          mimeType: 'application/pdf',
        })
      ).rejects.toThrow(ApplicationNotMutableError);
    });
  });

  describe('authorizeDocumentDeletion', () => {
    it('returns null when the document does not exist (clean no-op)', async () => {
      expect(await authorizeDocumentDeletion(prisma, { clientId: 'someone', documentId: 'nonexistent' })).toBeNull();
    });

    it('returns the document for its owning client on a mutable application', async () => {
      const application = await seedApplication();
      const document = await createDocument(prisma, {
        applicationId: application.id,
        type: 'ID',
        storageKey: 'a/id.pdf',
        originalFilename: 'id.pdf',
        mimeType: 'application/pdf',
      });
      const result = await authorizeDocumentDeletion(prisma, {
        clientId: application.clientId,
        documentId: document.id,
      });
      expect(result?.id).toBe(document.id);
    });

    it("rejects deleting another client's document", async () => {
      const application = await seedApplication();
      const document = await createDocument(prisma, {
        applicationId: application.id,
        type: 'ID',
        storageKey: 'a/id.pdf',
        originalFilename: 'id.pdf',
        mimeType: 'application/pdf',
      });
      await expect(
        authorizeDocumentDeletion(prisma, { clientId: 'a-different-client-id', documentId: document.id })
      ).rejects.toThrow(ForbiddenError);
    });

    it('rejects deleting a document once the application has been decided', async () => {
      const application = await seedApplication('APPROVED');
      const document = await createDocument(prisma, {
        applicationId: application.id,
        type: 'ID',
        storageKey: 'a/id.pdf',
        originalFilename: 'id.pdf',
        mimeType: 'application/pdf',
      });
      await expect(
        authorizeDocumentDeletion(prisma, { clientId: application.clientId, documentId: document.id })
      ).rejects.toThrow(ApplicationNotMutableError);
    });
  });
});
