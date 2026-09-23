import type { PrismaClient } from '@prisma/client';
import { applicationFormSchema } from '@/lib/validation/loan';

export type SubmitResult = { ok: true } | { ok: false; errors: string[] };

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

  await prisma.$transaction([
    prisma.loanApplication.update({
      where: { id: applicationId },
      data: {
        amount: parsed.data.amount,
        termMonths: parsed.data.termMonths,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    }),
    prisma.auditLog.create({
      data: {
        actorType: 'CLIENT',
        actorId: application.clientId,
        action: 'APPLICATION_SUBMITTED',
        entityType: 'LoanApplication',
        entityId: applicationId,
        metadata: {},
      },
    }),
  ]);

  return { ok: true };
}
