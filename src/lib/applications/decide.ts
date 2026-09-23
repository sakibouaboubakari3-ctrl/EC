import type { PrismaClient } from '@prisma/client';
import { generateAmortizationSchedule } from '@/lib/amortization';

export class ForbiddenError extends Error {}
export class AlreadyDecidedError extends Error {}

const DECIDABLE_STATUSES = ['SUBMITTED', 'IN_REVIEW'] as const;

export interface DecideApplicationInput {
  applicationId: string;
  staffId: string;
  staffRole: 'AGENT' | 'SUPERVISOR' | 'ADMIN';
  decision: 'APPROVED' | 'REJECTED';
  reason?: string;
}

export async function decideApplication(
  prisma: PrismaClient,
  input: DecideApplicationInput
): Promise<void> {
  if (input.staffRole === 'AGENT') {
    throw new ForbiddenError('Agents cannot approve or reject applications');
  }
  if (input.decision === 'REJECTED' && !input.reason) {
    throw new Error('A reason is required to reject an application');
  }

  const application = await prisma.loanApplication.findUniqueOrThrow({
    where: { id: input.applicationId },
  });

  await prisma.$transaction(async (tx) => {
    const { count } = await tx.loanApplication.updateMany({
      where: { id: input.applicationId, status: { in: DECIDABLE_STATUSES } },
      data: {
        status: input.decision,
        decidedAt: new Date(),
        decidedByStaffId: input.staffId,
        decisionReason: input.reason ?? null,
      },
    });
    if (count !== 1) {
      throw new AlreadyDecidedError(
        `Application ${input.applicationId} has already been decided`
      );
    }

    if (input.decision === 'APPROVED') {
      const schedule = generateAmortizationSchedule(
        application.amount,
        application.termMonths,
        application.rate
      );
      await tx.loanScheduleEntry.createMany({
        data: schedule.map((entry) => ({
          applicationId: input.applicationId,
          dueDate: entry.dueDate,
          amount: entry.amount,
          status: 'UPCOMING',
        })),
      });
    }

    await tx.auditLog.create({
      data: {
        actorType: 'STAFF',
        actorId: input.staffId,
        action: input.decision === 'APPROVED' ? 'APPLICATION_APPROVED' : 'APPLICATION_REJECTED',
        entityType: 'LoanApplication',
        entityId: input.applicationId,
        metadata: { reason: input.reason ?? null },
      },
    });
  });
}
