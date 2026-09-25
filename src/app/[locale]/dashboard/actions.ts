'use server';

import { del } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { clientAuth } from '@/lib/auth/client-auth';
import { getDocumentById, deleteDocument } from '@/lib/documents/documents';

export async function deleteDocumentAction(documentId: string): Promise<void> {
  const session = await clientAuth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const document = await getDocumentById(prisma, documentId);
  if (!document) return;

  const application = await prisma.loanApplication.findUniqueOrThrow({
    where: { id: document.applicationId },
  });
  if (application.clientId !== session.user.id) {
    throw new Error('Forbidden');
  }

  await del(document.storageKey);
  await deleteDocument(prisma, documentId);
}
