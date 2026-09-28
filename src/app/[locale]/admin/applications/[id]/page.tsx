import { notFound } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';
import { prisma } from '@/lib/prisma';
import { decideAction, startReviewAction } from '../../actions';
import { listDocumentsForApplication } from '@/lib/documents/documents';
import { StatusBadge } from '@/components/StatusBadge';
import {
  pageShellClass,
  labelClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/lib/ui/classnames';
import type { ApplicationStatus } from '@prisma/client';

interface DetailApplication {
  id: string;
  amount: number;
  termMonths: number;
  status: ApplicationStatus;
  decisionReason: string | null;
  contractSignedAt: Date | null;
  disbursementScheduledAt: Date | null;
  client: { email: string };
}

function ApplicationDetailView({
  application,
  documents,
  approveAction,
  rejectAction,
  startReviewAction,
}: {
  application: DetailApplication;
  documents: { id: string; type: string; originalFilename: string; uploadedAt: Date }[];
  approveAction: (formData: FormData) => Promise<void>;
  rejectAction: (formData: FormData) => Promise<void>;
  startReviewAction: () => Promise<void>;
}) {
  const t = useTranslations();
  const format = useFormatter();
  const isDecidable = application.status === 'SUBMITTED' || application.status === 'IN_REVIEW';

  return (
    <main className={pageShellClass} data-testid="application-detail">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-[var(--color-navy)]">{t('admin.detailTitle')}</h1>
            <StatusBadge status={application.status} />
          </div>
          {application.status === 'SUBMITTED' && (
            <form action={startReviewAction} className="mt-4">
              <button type="submit" className={`w-full sm:w-auto ${secondaryButtonClass}`}>
                {t('admin.startReview')}
              </button>
            </form>
          )}
          <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-[var(--color-navy)]/60">{t('auth.email')}</dt>
              <dd className="font-medium text-[var(--color-navy)]">{application.client.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--color-navy)]/60">{t('simulator.amountLabel')}</dt>
              <dd className="font-medium text-[var(--color-navy)]">
                {application.amount.toLocaleString('fr-CA')} $
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--color-navy)]/60">{t('simulator.termLabel')}</dt>
              <dd className="font-medium text-[var(--color-navy)]">{application.termMonths}</dd>
            </div>
            {application.status === 'REJECTED' && application.decisionReason && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-[var(--color-navy)]/60">{t('admin.reasonLabel')}</dt>
                <dd className="font-medium text-[var(--color-navy)]">{application.decisionReason}</dd>
              </div>
            )}
            {application.contractSignedAt && (
              <div>
                <dt className="text-xs text-[var(--color-navy)]/60">{t('contract.signedOn')}</dt>
                <dd className="font-medium text-[var(--color-navy)]">
                  {format.dateTime(application.contractSignedAt, { dateStyle: 'long' })}
                </dd>
              </div>
            )}
            {application.disbursementScheduledAt && (
              <div>
                <dt className="text-xs text-[var(--color-navy)]/60">{t('contract.depositScheduledFor')}</dt>
                <dd className="font-medium text-[var(--color-navy)]">
                  {format.dateTime(application.disbursementScheduledAt, { dateStyle: 'long' })}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-[var(--color-navy)]">{t('documents.title')}</h2>
          {documents.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--color-navy)]/60">{t('documents.noFile')}</p>
          ) : (
            <ul className="mt-2 divide-y divide-[var(--color-navy)]/5">
              {documents.map((document) => (
                <li key={document.id} className="flex items-center justify-between py-2">
                  <span className="text-sm text-[var(--color-navy)]">
                    {document.type} — {document.originalFilename}
                  </span>
                  <a
                    href={`/api/documents/${document.id}/download`}
                    className="text-sm font-bold text-[var(--color-accent-deep)] underline"
                    aria-label={document.originalFilename}
                  >
                    ⬇
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        {isDecidable && (
          <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <form action={approveAction} className="flex-1">
                <button type="submit" className={`w-full ${primaryButtonClass}`}>
                  ✓ {t('admin.approve')}
                </button>
              </form>
              <form action={rejectAction} className="flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <label htmlFor="reason" className={labelClass}>
                    {t('admin.reasonLabel')}
                  </label>
                  <input id="reason" name="reason" required className={inputClass} />
                </div>
                <button type="submit" className={`w-full ${secondaryButtonClass}`}>
                  ✕ {t('admin.reject')}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
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

  const documents = await listDocumentsForApplication(prisma, application.id);

  const approveAction = decideAction.bind(null, application.id, 'APPROVED');
  const rejectAction = decideAction.bind(null, application.id, 'REJECTED');
  const boundStartReviewAction = startReviewAction.bind(null, application.id);

  return (
    <ApplicationDetailView
      application={application}
      documents={documents}
      approveAction={approveAction}
      rejectAction={rejectAction}
      startReviewAction={boundStartReviewAction}
    />
  );
}
