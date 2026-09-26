'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { staffAuth } from '@/lib/auth/staff-auth';
import { decideApplication, ForbiddenError, AlreadyDecidedError } from '@/lib/applications/decide';
import { startReview, NotSubmittedError } from '@/lib/applications/start-review';
import { getEmailClient, getAppUrl } from '@/lib/email/client';
import { notifyApplicationDecision } from '@/lib/email/notifications';

export async function startReviewAction(applicationId: string): Promise<void> {
  const session = await staffAuth();
  if (!session?.user?.id) {
    redirect('/admin/login');
  }

  try {
    await startReview(prisma, { applicationId, staffId: session.user.id });
  } catch (error) {
    if (error instanceof NotSubmittedError) {
      redirect(`/admin/applications/${applicationId}`);
    }
    throw error;
  }

  revalidatePath('/[locale]/admin/applications/[id]', 'page');
  revalidatePath('/[locale]/admin', 'page');
  redirect(`/admin/applications/${applicationId}`);
}

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

  try {
    const application = await prisma.loanApplication.findUniqueOrThrow({
      where: { id: applicationId },
      include: { client: true },
    });
    await notifyApplicationDecision(getEmailClient(), {
      clientEmail: application.client.email,
      clientName: `${application.client.firstName} ${application.client.lastName}`,
      locale: application.client.locale === 'en' ? 'en' : 'fr',
      decision,
      reason: reason ?? null,
      appUrl: getAppUrl(),
    });
  } catch (error) {
    console.error('Failed to send application-decision email', error);
  }

  // The redirect below targets the same route the staff member is already on.
  // Next.js's client-side router cache would otherwise keep serving the
  // pre-decision RSC payload for that route (stale approve/reject buttons)
  // until a manual reload, since a bare redirect() does not invalidate it.
  revalidatePath('/[locale]/admin/applications/[id]', 'page');
  revalidatePath('/[locale]/admin', 'page');
  redirect(`/admin/applications/${applicationId}`);
}
