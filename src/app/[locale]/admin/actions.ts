'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { staffAuth } from '@/lib/auth/staff-auth';
import { decideApplication, ForbiddenError, AlreadyDecidedError } from '@/lib/applications/decide';

export async function decideAction(
  applicationId: string,
  decision: 'APPROVED' | 'REJECTED',
  formData: FormData
) {
  const session = await staffAuth();
  if (!session?.user?.id || !session.user.role) {
    redirect('/admin/login');
  }
  const reasonValue = String(formData.get('reason') ?? '');
  const reason = reasonValue.length > 0 ? reasonValue : undefined;

  try {
    await decideApplication(prisma, {
      applicationId,
      staffId: session.user.id,
      staffRole: session.user.role,
      decision,
      reason,
    });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      redirect(`/admin/applications/${applicationId}?error=forbidden`);
    }
    if (error instanceof AlreadyDecidedError) {
      redirect(`/admin/applications/${applicationId}?error=already-decided`);
    }
    throw error;
  }
  redirect(`/admin/applications/${applicationId}`);
}
