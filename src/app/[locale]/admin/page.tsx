import { useTranslations } from 'next-intl';
import { prisma } from '@/lib/prisma';
import { listApplications } from '@/lib/applications/list';
import { statusMessageKey } from '@/lib/status-label';
import type { ApplicationStatus } from '@prisma/client';
import { Link } from '@/i18n/navigation';

interface CaseListParams {
  status?: string;
  name?: string;
  page?: string;
}

interface CaseListApplication {
  id: string;
  amount: number;
  status: ApplicationStatus;
  client: { firstName: string; lastName: string };
}

function CaseListView({
  params,
  applications,
  total,
}: {
  params: CaseListParams;
  applications: CaseListApplication[];
  total: number;
}) {
  const t = useTranslations();

  return (
    <main className="p-8">
      <h1 className="font-[family-name:var(--font-serif)] text-2xl text-[var(--color-navy)]">
        {t('admin.caseListTitle')}
      </h1>
      <form className="mt-4 flex gap-2">
        <input name="name" placeholder={t('admin.searchPlaceholder')} defaultValue={params.name} />
        <select name="status" defaultValue={params.status ?? ''}>
          <option value="">{t('admin.statusFilter')}</option>
          <option value="SUBMITTED">{t('dashboard.statusSubmitted')}</option>
          <option value="IN_REVIEW">{t('dashboard.statusInReview')}</option>
          <option value="APPROVED">{t('dashboard.statusApproved')}</option>
          <option value="REJECTED">{t('dashboard.statusRejected')}</option>
        </select>
        <button type="submit">{t('common.submit')}</button>
      </form>
      <table className="mt-6 w-full text-left" data-testid="case-list-table">
        <thead>
          <tr>
            <th>{t('admin.clientColumn')}</th>
            <th>{t('simulator.amountLabel')}</th>
            <th>{t('admin.statusFilter')}</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((application) => (
            <tr key={application.id} data-testid={`case-row-${application.id}`}>
              <td>
                <Link href={`/admin/applications/${application.id}`}>
                  {application.client.firstName} {application.client.lastName}
                </Link>
              </td>
              <td>{application.amount}</td>
              <td>{t(statusMessageKey(application.status))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-sm">
        {total} {t('admin.caseListTitle')}
      </p>
    </main>
  );
}

export default async function AdminCaseListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; name?: string; page?: string }>;
}) {
  const params = await searchParams;
  const { applications, total } = await listApplications(prisma, {
    status: params.status ? (params.status as ApplicationStatus) : undefined,
    clientName: params.name,
    page: params.page ? Number(params.page) : 1,
  });

  return <CaseListView params={params} applications={applications} total={total} />;
}
