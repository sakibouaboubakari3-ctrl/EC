import type { PrismaClient } from '@prisma/client';
import { applicationFormSchema } from '@/lib/validation/loan';

export type SubmitResult = { ok: true } | { ok: false; errors: string[] };

export class AlreadySubmittedError extends Error {}

export async function submitApplication(
  prisma: PrismaClient,
  applicationId: string
): Promise<SubmitResult> {
  const application = await prisma.loanApplication.findUniqueOrThrow({
    where: { id: applicationId },
  });
  const parsed = applicationFormSchema.safeParse(application.formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.issues.map((issue) => issue.message) };
  }

  await prisma.$transaction(async (tx) => {
    const { count } = await tx.loanApplication.updateMany({
      where: { id: applicationId, status: 'DRAFT' },
      data: {
        amount: parsed.data.amount,
        termMonths: parsed.data.termMonths,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });
    if (count !== 1) {
      throw new AlreadySubmittedError(`Application ${applicationId} is not in DRAFT status`);
    }
    await tx.auditLog.create({
      data: {
        actorType: 'CLIENT',
        actorId: application.clientId,
        action: 'APPLICATION_SUBMITTED',
        entityType: 'LoanApplication',
        entityId: applicationId,
        metadata: {},
      },
    });
  });

  return { ok: true };
}
