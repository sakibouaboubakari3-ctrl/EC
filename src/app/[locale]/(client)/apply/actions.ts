'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { clientAuth } from '@/lib/auth/client-auth';
import { getOrCreateDraftApplication, saveApplicationStep } from '@/lib/applications/draft';
import {
  submitApplication as submitApplicationLib,
  AlreadySubmittedError,
  type SubmitResult,
} from '@/lib/applications/submit';
import { getEmailClient, getAppUrl } from '@/lib/email/client';
import { notifyApplicationSubmitted } from '@/lib/email/notifications';

async function requireClientId(): Promise<string> {
  const session = await clientAuth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  return session.user.id;
}

export async function getDraftApplicationId(): Promise<string> {
  const clientId = await requireClientId();
  const application = await getOrCreateDraftApplication(prisma, clientId);
  return application.id;
}

export async function saveStepAction(
  applicationId: string,
  stepData: Record<string, unknown>
): Promise<void> {
  const clientId = await requireClientId();
  const application = await prisma.loanApplication.findUniqueOrThrow({ where: { id: applicationId } });
  if (application.clientId !== clientId) {
    throw new Error('Forbidden');
  }
  await saveApplicationStep(prisma, applicationId, stepData);
}

export async function submitApplicationAction(applicationId: string) {
  const clientId = await requireClientId();
  const application = await prisma.loanApplication.findUniqueOrThrow({ where: { id: applicationId } });
  if (application.clientId !== clientId) {
    throw new Error('Forbidden');
  }
  let result: SubmitResult;
  try {
    result = await submitApplicationLib(prisma, applicationId);
  } catch (error) {
    if (error instanceof AlreadySubmittedError) {
      redirect('/dashboard');
    }
    throw error;
  }
  if (!result.ok) {
    redirect('/apply/review?error=validation');
  }

  try {
    const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });
    await notifyApplicationSubmitted(getEmailClient(), {
      clientEmail: client.email,
      clientName: `${client.firstName} ${client.lastName}`,
      locale: client.locale === 'en' ? 'en' : 'fr',
      amount: application.amount,
      appUrl: getAppUrl(),
    });
  } catch (error) {
    console.error('Failed to send application-submitted email', error);
  }

  redirect('/dashboard');
}
