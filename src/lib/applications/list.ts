import type { PrismaClient, ApplicationStatus } from '@prisma/client';

export interface ListApplicationsFilters {
  status?: ApplicationStatus;
  clientName?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  pageSize?: number;
}

export interface ListApplicationsResult {
  applications: Array<{
    id: string;
    amount: number;
    termMonths: number;
    status: ApplicationStatus;
    submittedAt: Date | null;
    client: { firstName: string; lastName: string; email: string };
  }>;
  total: number;
}

export async function listApplications(
  prisma: PrismaClient,
  filters: ListApplicationsFilters = {}
): Promise<ListApplicationsResult> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;

  const where = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.minAmount !== undefined || filters.maxAmount !== undefined
      ? {
          amount: {
            ...(filters.minAmount !== undefined ? { gte: filters.minAmount } : {}),
            ...(filters.maxAmount !== undefined ? { lte: filters.maxAmount } : {}),
          },
        }
      : {}),
    ...(filters.clientName
      ? {
          client: {
            OR: [
              { firstName: { contains: filters.clientName, mode: 'insensitive' as const } },
              { lastName: { contains: filters.clientName, mode: 'insensitive' as const } },
            ],
          },
        }
      : {}),
  };

  const [applications, total] = await Promise.all([
    prisma.loanApplication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        amount: true,
        termMonths: true,
        status: true,
        submittedAt: true,
        client: { select: { firstName: true, lastName: true, email: true } },
      },
    }),
    prisma.loanApplication.count({ where }),
  ]);

  return { applications, total };
}
