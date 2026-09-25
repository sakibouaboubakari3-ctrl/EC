'use server';

import { del } from '@vercel/blob';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { clientAuth } from '@/lib/auth/client-auth';
import {
  confirmDocumentUpload,
  authorizeDocumentDeletion,
  deleteDocument,
} from '@/lib/documents/documents';

export interface ConfirmDocumentUploadActionInput {
  applicationId: string;
  type: string;
  storageKey: string;
  originalFilename: string;
  mimeType: string;
}

export async function confirmDocumentUploadAction(input: ConfirmDocumentUploadActionInput): Promise<void> {
  const session = await clientAuth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const { deletedStorageKeys } = await confirmDocumentUpload(prisma, {
    clientId: session.user.id,
    ...input,
  });

  if (deletedStorageKeys.length > 0) {
    await del(deletedStorageKeys);
  }

  revalidatePath('/[locale]/dashboard', 'page');
}

export async function deleteDocumentAction(documentId: string): Promise<void> {
  const session = await clientAuth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const document = await authorizeDocumentDeletion(prisma, {
    clientId: session.user.id,
    documentId,
  });
  if (!document) return;

  await del(document.storageKey);
  await deleteDocument(prisma, documentId);

  revalidatePath('/[locale]/dashboard', 'page');
}
