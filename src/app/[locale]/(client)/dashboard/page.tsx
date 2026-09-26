import { redirect } from 'next/navigation';
import { useFormatter, useTranslations, useLocale } from 'next-intl';
import { prisma } from '@/lib/prisma';
import { clientAuth } from '@/lib/auth/client-auth';
import { statusMessageKey } from '@/lib/status-label';
import { listDocumentsForApplication } from '@/lib/documents/documents';
import { DocumentUpload, type DocumentSummary } from '@/components/DocumentUpload';
import { ContractSignForm } from '@/components/ContractSignForm';
import { StatusBadge } from '@/components/StatusBadge';
import { renderLoanContractHtml, COMPANY_LEGAL_NAME } from '@/lib/contracts/contract-template';
import { calculateNetDisbursement, ORIGINATION_FEE_RATE } from '@/lib/config/loan';
import { pageShellClass } from '@/lib/ui/classnames';
import type { ApplicationStatus } from '@prisma/client';

const cardClass = 'rounded-2xl bg-white p-6 shadow-sm';

const COMPANY_REP_NAME = 'Kenth Tremblay';
const COMPANY_REP_TITLE_FR = 'Président-directeur général';
const COMPANY_REP_TITLE_EN = 'Chief Executive Officer';

interface DashboardApplication {
  id: string;
  status: ApplicationStatus;
  decisionReason: string | null;
  amount: number;
  termMonths: number;
  rate: number;
  decidedAt: Date | null;
  contractSignedAt: Date | null;
  disbursementScheduledAt: Date | null;
  formData: unknown;
  client: { email: string; firstName: string; lastName: string; locale: string };
  schedule: Array<{ id: string; dueDate: Date; amount: number }>;
}

function ContractCard({ application, locale }: { application: DashboardApplication; locale: string }) {
  const t = useTranslations('contract');
  const format = useFormatter();
  const formData = (application.formData ?? {}) as Record<string, unknown>;
  const addressParts = [formData.address, formData.city, formData.postalCode].filter(Boolean);
  const clientAddress = addressParts.length > 0 ? addressParts.join(', ') : '—';
  const feeAmount = application.amount * ORIGINATION_FEE_RATE;
  const netAmount = calculateNetDisbursement(application.amount);
  const monthlyPayment = application.schedule[0]?.amount ?? 0;

  const html = renderLoanContractHtml({
    locale: locale === 'en' ? 'en' : 'fr',
    clientName: `${application.client.firstName} ${application.client.lastName}`,
    clientEmail: application.client.email,
    clientAddress,
    amount: application.amount,
    termMonths: application.termMonths,
    annualRate: application.rate,
    monthlyPayment,
    feeAmount,
    netAmount,
    companyRepName: COMPANY_REP_NAME,
    companyRepTitle: locale === 'en' ? COMPANY_REP_TITLE_EN : COMPANY_REP_TITLE_FR,
    companySignedAt: application.decidedAt ?? new Date(),
    clientSignedAt: application.contractSignedAt,
  });

  return (
    <section className={cardClass} data-testid="contract-section">
      <h2 className="text-lg font-bold text-[var(--color-navy)]">
        {t('title')} — {COMPANY_LEGAL_NAME}
      </h2>
      <iframe
        title={t('title')}
        srcDoc={html}
        className="mt-3 h-[500px] w-full rounded-lg border border-[var(--color-navy)]/10"
      />
      {application.contractSignedAt ? (
        <div className="mt-3 rounded-lg bg-[var(--color-accent)]/10 p-4 text-sm text-[var(--color-navy)]">
          <p>
            {t('signedOn')} {format.dateTime(application.contractSignedAt, { dateStyle: 'long' })}
          </p>
          {application.disbursementScheduledAt && (
            <p>
              {t('depositScheduledFor')}{' '}
              {format.dateTime(application.disbursementScheduledAt, { dateStyle: 'long' })}
            </p>
          )}
        </div>
      ) : (
        <ContractSignForm applicationId={application.id} />
      )}
    </section>
  );
}

function DashboardView({
  application,
  documents,
}: {
  application: DashboardApplication | null;
  documents: DocumentSummary[];
}) {
  const t = useTranslations();
  const format = useFormatter();
  const locale = useLocale();

  if (!application) {
    return (
      <main className={pageShellClass}>
        <div className={`mx-auto max-w-3xl ${cardClass}`}>
          <h1 className="text-2xl font-bold text-[var(--color-navy)]">{t('dashboard.title')}</h1>
          <p data-testid="application-status" className="mt-2 text-[var(--color-navy)]/70">
            {t('dashboard.statusDraft')}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={pageShellClass} data-testid="dashboard">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[var(--color-navy)]">{t('dashboard.title')}</h1>
            <StatusBadge status={application.status} />
          </div>
          <p data-testid="application-status" className="sr-only">
            {t(statusMessageKey(application.status))}
          </p>
          {application.status === 'REJECTED' && application.decisionReason && (
            <p data-testid="decision-reason" className="mt-3 text-[var(--color-navy)]/80">
              {application.decisionReason}
            </p>
          )}
        </div>
        {application.status === 'APPROVED' && (
          <div className={cardClass}>
            <table className="w-full text-left" data-testid="schedule-table">
              <thead>
                <tr className="border-b border-[var(--color-navy)]/10 text-sm text-[var(--color-navy)]/60">
                  <th className="pb-2 font-medium">{t('dashboard.dueDate')}</th>
                  <th className="pb-2 text-right font-medium">{t('dashboard.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {application.schedule.map((entry) => (
                  <tr key={entry.id} className="border-b border-[var(--color-navy)]/5 last:border-0">
                    <td className="py-2">{format.dateTime(entry.dueDate, { dateStyle: 'medium' })}</td>
                    <td className="py-2 text-right">
                      {format.number(entry.amount, { style: 'currency', currency: 'CAD' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {application.status === 'APPROVED' && <ContractCard application={application} locale={locale} />}
        <DocumentUpload applicationId={application.id} documents={documents} />
      </div>
    </main>
  );
}

export default async function DashboardPage() {
  const session = await clientAuth();
  if (!session?.user?.id) redirect('/login');

  const application = await prisma.loanApplication.findFirst({
    where: { clientId: session.user.id, status: { not: 'DRAFT' } },
    orderBy: { createdAt: 'desc' },
    include: { schedule: { orderBy: { dueDate: 'asc' } }, client: true },
  });

  const documents = application
    ? await listDocumentsForApplication(prisma, application.id)
    : [];

  return <DashboardView application={application} documents={documents} />;
}
