import type { PrismaClient } from '@prisma/client';

export class ForbiddenError extends Error {}
export class NotApprovedError extends Error {}
export class AlreadySignedError extends Error {}

const DISBURSEMENT_DELAY_DAYS = 2;

export interface SignContractInput {
  applicationId: string;
  clientId: string;
}

export async function signContract(prisma: PrismaClient, input: SignContractInput): Promise<void> {
  const application = await prisma.loanApplication.findUniqueOrThrow({
    where: { id: input.applicationId },
  });

  if (application.clientId !== input.clientId) {
    throw new ForbiddenError("Cannot sign another client's contract");
  }
  if (application.status !== 'APPROVED') {
    throw new NotApprovedError('Cannot sign a contract for an application that is not approved');
  }
  if (application.contractSignedAt) {
    throw new AlreadySignedError('This contract has already been signed');
  }

  const now = new Date();
  const disbursementScheduledAt = new Date(now.getTime() + DISBURSEMENT_DELAY_DAYS * 24 * 60 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.loanApplication.update({
      where: { id: input.applicationId },
      data: { contractSignedAt: now, disbursementScheduledAt },
    });
    await tx.auditLog.create({
      data: {
        actorType: 'CLIENT',
        actorId: input.clientId,
        action: 'CONTRACT_SIGNED',
        entityType: 'LoanApplication',
        entityId: input.applicationId,
        metadata: {},
      },
    });
  });
}
