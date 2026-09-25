import { DocumentType } from '@prisma/client';
import type { PrismaClient, Document } from '@prisma/client';

const DOCUMENT_TYPE_VALUES = Object.values(DocumentType) as string[];

export function isValidDocumentType(value: string): value is DocumentType {
  return DOCUMENT_TYPE_VALUES.includes(value);
}

export interface CreateDocumentInput {
  applicationId: string;
  type: DocumentType;
  storageKey: string;
  originalFilename: string;
  mimeType: string;
}

export async function createDocument(prisma: PrismaClient, input: CreateDocumentInput): Promise<Document> {
  return prisma.document.create({ data: input });
}

export async function listDocumentsForApplication(
  prisma: PrismaClient,
  applicationId: string
): Promise<Document[]> {
  return prisma.document.findMany({
    where: { applicationId },
    orderBy: { uploadedAt: 'desc' },
  });
}

export async function getDocumentById(prisma: PrismaClient, documentId: string): Promise<Document | null> {
  return prisma.document.findUnique({ where: { id: documentId } });
}

export async function deleteDocument(prisma: PrismaClient, documentId: string): Promise<void> {
  await prisma.document.deleteMany({ where: { id: documentId } });
}

const SINGLE_FILE_TYPES: DocumentType[] = ['ID', 'INCOME_PROOF'];

export async function replaceSingleTypeDocument(
  prisma: PrismaClient,
  input: CreateDocumentInput
): Promise<{ created: Document; deleted: Document[] }> {
  const created = await createDocument(prisma, input);

  let deleted: Document[] = [];
  if (SINGLE_FILE_TYPES.includes(input.type)) {
    deleted = await prisma.document.findMany({
      where: { applicationId: input.applicationId, type: input.type, id: { not: created.id } },
    });
    await prisma.document.deleteMany({
      where: { applicationId: input.applicationId, type: input.type, id: { not: created.id } },
    });
  }

  return { created, deleted };
}

export class InvalidDocumentTypeError extends Error {}
export class ForbiddenError extends Error {}

export interface AuthorizeDocumentUploadInput {
  clientId: string;
  applicationId: string;
  type: string;
}

export async function authorizeDocumentUpload(
  prisma: PrismaClient,
  input: AuthorizeDocumentUploadInput
): Promise<void> {
  if (!isValidDocumentType(input.type)) {
    throw new InvalidDocumentTypeError(`Invalid document type: ${input.type}`);
  }
  const application = await prisma.loanApplication.findUniqueOrThrow({
    where: { id: input.applicationId },
  });
  if (application.clientId !== input.clientId) {
    throw new ForbiddenError("Cannot upload a document to another client's application");
  }
}
