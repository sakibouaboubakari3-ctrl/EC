import { notFound } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { prisma } from '@/lib/prisma';
import { decideAction } from '../../actions';
import type { ApplicationStatus } from '@prisma/client';

interface DetailApplication {
  id: string;
  amount: number;
  termMonths: number;
  status: ApplicationStatus;
  client: { email: string };
}

function ApplicationDetailView({
  application,
  approveAction,
  rejectAction,
}: {
  application: DetailApplication;
  approveAction: (formData: FormData) => Promise<void>;
  rejectAction: (formData: FormData) => Promise<void>;
}) {
  const t = useTranslations();
  const isDecidable = application.status === 'SUBMITTED' || application.status === 'IN_REVIEW';

  return (
    <main className="p-8" data-testid="application-detail">
      <h1 className="font-[family-name:var(--font-serif)] text-2xl text-[var(--color-navy)]">
        {t('admin.detailTitle')}
      </h1>
      <dl className="mt-4 grid grid-cols-2 gap-2">
        <dt>{t('auth.email')}</dt>
        <dd>{application.client.email}</dd>
        <dt>{t('simulator.amountLabel')}</dt>
        <dd>{application.amount}</dd>
        <dt>{t('simulator.termLabel')}</dt>
        <dd>{application.termMonths}</dd>
      </dl>
      {isDecidable && (
        <div className="mt-6 flex gap-4">
          <form action={approveAction}>
            <button
              type="submit"
              className="rounded-full bg-[var(--color-accent)] px-6 py-2 font-bold text-[var(--color-navy)]"
            >
              {t('admin.approve')}
            </button>
          </form>
          <form action={rejectAction} className="flex items-end gap-2">
            <div className="flex flex-col">
              <label htmlFor="reason">{t('admin.reasonLabel')}</label>
              <input id="reason" name="reason" required />
            </div>
            <button
              type="submit"
              className="rounded-full border border-[var(--color-navy)] px-6 py-2 font-bold text-[var(--color-navy)]"
            >
              {t('admin.reject')}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const application = await prisma.loanApplication.findUnique({
    where: { id },
    include: { client: true },
  });
  if (!application) notFound();

  const approveAction = decideAction.bind(null, application.id, 'APPROVED');
  const rejectAction = decideAction.bind(null, application.id, 'REJECTED');

  return (
    <ApplicationDetailView
      application={application}
      approveAction={approveAction}
      rejectAction={rejectAction}
    />
  );
}
