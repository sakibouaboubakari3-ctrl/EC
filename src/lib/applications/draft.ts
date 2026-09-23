import type { PrismaClient, LoanApplication, Prisma } from '@prisma/client';
import { DEFAULT_LOAN_AMOUNT, DEFAULT_TERM_MONTHS, ANNUAL_INTEREST_RATE } from '@/lib/config/loan';

export async function getOrCreateDraftApplication(
  prisma: PrismaClient,
  clientId: string
): Promise<LoanApplication> {
  const existing = await prisma.loanApplication.findFirst({
    where: { clientId, status: 'DRAFT' },
    orderBy: { createdAt: 'desc' },
  });
  if (existing) return existing;
  return prisma.loanApplication.create({
    data: {
      clientId,
      amount: DEFAULT_LOAN_AMOUNT,
      termMonths: DEFAULT_TERM_MONTHS,
      rate: ANNUAL_INTEREST_RATE,
      status: 'DRAFT',
      formData: {},
    },
  });
}

export async function saveApplicationStep(
  prisma: PrismaClient,
  applicationId: string,
  stepData: Record<string, unknown>
): Promise<LoanApplication> {
  const application = await prisma.loanApplication.findUniqueOrThrow({
    where: { id: applicationId },
  });
  const mergedFormData = {
    ...(application.formData as Record<string, unknown>),
    ...stepData,
  };
  return prisma.loanApplication.update({
    where: { id: applicationId },
    data: { formData: mergedFormData as Prisma.InputJsonValue },
  });
}
