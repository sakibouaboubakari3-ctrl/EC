import { DocumentType } from '@prisma/client';
import type { PrismaClient, Document, ApplicationStatus } from '@prisma/client';

export const MUTABLE_APPLICATION_STATUSES: ApplicationStatus[] = ['SUBMITTED', 'IN_REVIEW'];

export function isApplicationMutable(status: ApplicationStatus): boolean {
  return MUTABLE_APPLICATION_STATUSES.includes(status);
}

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
export class ApplicationNotMutableError extends Error {}

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
  if (!isApplicationMutable(application.status)) {
    throw new ApplicationNotMutableError('Cannot modify documents after a decision has been made');
  }
}

export interface ConfirmDocumentUploadInput extends AuthorizeDocumentUploadInput {
  storageKey: string;
  originalFilename: string;
  mimeType: string;
}

export interface ConfirmDocumentUploadResult {
  created: Document;
  deletedStorageKeys: string[];
}

export function expectedStorageKeyPrefix(applicationId: string, type: string): string {
  return `applications/${applicationId}/${type}/`;
}

export async function confirmDocumentUpload(
  prisma: PrismaClient,
  input: ConfirmDocumentUploadInput
): Promise<ConfirmDocumentUploadResult> {
  await authorizeDocumentUpload(prisma, {
    clientId: input.clientId,
    applicationId: input.applicationId,
    type: input.type,
  });

  if (!isValidDocumentType(input.type)) {
    throw new InvalidDocumentTypeError(`Invalid document type: ${input.type}`);
  }
  if (!input.storageKey.startsWith(expectedStorageKeyPrefix(input.applicationId, input.type))) {
    throw new ForbiddenError('Storage key does not match the authorized application/type');
  }

  const documentInput: CreateDocumentInput = {
    applicationId: input.applicationId,
    type: input.type,
    storageKey: input.storageKey,
    originalFilename: input.originalFilename,
    mimeType: input.mimeType,
  };

  if (SINGLE_FILE_TYPES.includes(input.type)) {
    const { created, deleted } = await replaceSingleTypeDocument(prisma, documentInput);
    return { created, deletedStorageKeys: deleted.map((d) => d.storageKey) };
  }

  const created = await createDocument(prisma, documentInput);
  return { created, deletedStorageKeys: [] };
}

export interface AuthorizeDocumentDeletionInput {
  clientId: string;
  documentId: string;
}

export async function authorizeDocumentDeletion(
  prisma: PrismaClient,
  input: AuthorizeDocumentDeletionInput
): Promise<Document | null> {
  const document = await getDocumentById(prisma, input.documentId);
  if (!document) return null;

  const application = await prisma.loanApplication.findUniqueOrThrow({
    where: { id: document.applicationId },
  });
  if (application.clientId !== input.clientId) {
    throw new ForbiddenError("Cannot delete another client's document");
  }
  if (!isApplicationMutable(application.status)) {
    throw new ApplicationNotMutableError('Cannot modify documents after a decision has been made');
  }

  return document;
}
