import type { PrismaClient } from '@prisma/client';

export class NotSubmittedError extends Error {}

export interface StartReviewInput {
  applicationId: string;
  staffId: string;
}

export async function startReview(prisma: PrismaClient, input: StartReviewInput): Promise<void> {
  const { count } = await prisma.loanApplication.updateMany({
    where: { id: input.applicationId, status: 'SUBMITTED' },
    data: { status: 'IN_REVIEW' },
  });
  if (count !== 1) {
    throw new NotSubmittedError(`Application ${input.applicationId} is not awaiting review`);
  }

  await prisma.auditLog.create({
    data: {
      actorType: 'STAFF',
      actorId: input.staffId,
      action: 'APPLICATION_REVIEW_STARTED',
      entityType: 'LoanApplication',
      entityId: input.applicationId,
      metadata: {},
    },
  });
}
