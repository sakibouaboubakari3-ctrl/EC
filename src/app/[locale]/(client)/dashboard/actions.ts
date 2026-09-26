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
import { signContract } from '@/lib/contracts/sign-contract';
import { calculateNetDisbursement } from '@/lib/config/loan';
import { getEmailClient, getAppUrl } from '@/lib/email/client';
import { notifyDepositScheduled } from '@/lib/email/notifications';

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

export async function signContractAction(applicationId: string): Promise<void> {
  const session = await clientAuth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  await signContract(prisma, { applicationId, clientId: session.user.id });

  try {
    const application = await prisma.loanApplication.findUniqueOrThrow({
      where: { id: applicationId },
      include: { client: true },
    });
    if (!application.disbursementScheduledAt) {
      throw new Error('Disbursement date missing after signing');
    }
    await notifyDepositScheduled(getEmailClient(), {
      clientEmail: application.client.email,
      clientName: `${application.client.firstName} ${application.client.lastName}`,
      locale: application.client.locale === 'en' ? 'en' : 'fr',
      netAmount: calculateNetDisbursement(application.amount),
      scheduledDate: application.disbursementScheduledAt,
      appUrl: getAppUrl(),
    });
  } catch (error) {
    console.error('Failed to send deposit-scheduled email', error);
  }

  revalidatePath('/[locale]/dashboard', 'page');
}
