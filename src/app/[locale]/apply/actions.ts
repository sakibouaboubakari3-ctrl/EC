'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { clientAuth } from '@/lib/auth/client-auth';
import { getOrCreateDraftApplication, saveApplicationStep } from '@/lib/applications/draft';

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
