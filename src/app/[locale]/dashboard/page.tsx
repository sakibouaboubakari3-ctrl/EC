import { redirect } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { prisma } from '@/lib/prisma';
import { clientAuth } from '@/lib/auth/client-auth';
import { statusMessageKey } from '@/lib/status-label';
import type { ApplicationStatus } from '@prisma/client';

interface DashboardApplication {
  status: ApplicationStatus;
  decisionReason: string | null;
  schedule: Array<{ id: string; dueDate: Date; amount: number }>;
}

function DashboardView({ application }: { application: DashboardApplication | null }) {
  const t = useTranslations();

  if (!application) {
    return (
      <main className="p-8">
        <h1 className="font-[family-name:var(--font-serif)] text-2xl text-[var(--color-navy)]">
          {t('dashboard.title')}
        </h1>
        <p data-testid="application-status">{t('dashboard.statusDraft')}</p>
      </main>
    );
  }

  return (
    <main className="p-8" data-testid="dashboard">
      <h1 className="font-[family-name:var(--font-serif)] text-2xl text-[var(--color-navy)]">
        {t('dashboard.title')}
      </h1>
      <p data-testid="application-status">{t(statusMessageKey(application.status))}</p>
      {application.status === 'REJECTED' && application.decisionReason && (
        <p data-testid="decision-reason">{application.decisionReason}</p>
      )}
      {application.status === 'APPROVED' && (
        <table className="mt-6 w-full text-left" data-testid="schedule-table">
          <thead>
            <tr>
              <th>{t('dashboard.dueDate')}</th>
              <th>{t('dashboard.amount')}</th>
            </tr>
          </thead>
          <tbody>
            {application.schedule.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.dueDate.toLocaleDateString()}</td>
                <td>{entry.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

export default async function DashboardPage() {
  const session = await clientAuth();
  if (!session?.user?.id) redirect('/login');

  const application = await prisma.loanApplication.findFirst({
    where: { clientId: session.user.id, status: { not: 'DRAFT' } },
    orderBy: { createdAt: 'desc' },
    include: { schedule: { orderBy: { dueDate: 'asc' } } },
  });

  return <DashboardView application={application} />;
}
