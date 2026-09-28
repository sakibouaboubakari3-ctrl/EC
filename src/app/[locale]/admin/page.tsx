import { useTranslations } from 'next-intl';
import { prisma } from '@/lib/prisma';
import { listApplications } from '@/lib/applications/list';
import { StatusBadge } from '@/components/StatusBadge';
import type { ApplicationStatus } from '@prisma/client';
import { Link } from '@/i18n/navigation';
import { pageShellClass, labelClass, inputClass, secondaryButtonClass } from '@/lib/ui/classnames';

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
    <main className={pageShellClass}>
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <h1 className="text-2xl font-bold text-[var(--color-navy)]">{t('admin.caseListTitle')}</h1>
          <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor="name" className={labelClass}>
                {t('admin.searchPlaceholder')}
              </label>
              <input
                id="name"
                name="name"
                placeholder={t('admin.searchPlaceholder')}
                defaultValue={params.name}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="status" className={labelClass}>
                {t('admin.statusFilter')}
              </label>
              <select id="status" name="status" defaultValue={params.status ?? ''} className={inputClass}>
                <option value="">{t('admin.statusFilter')}</option>
                <option value="SUBMITTED">{t('dashboard.statusSubmitted')}</option>
                <option value="IN_REVIEW">{t('dashboard.statusInReview')}</option>
                <option value="APPROVED">{t('dashboard.statusApproved')}</option>
                <option value="REJECTED">{t('dashboard.statusRejected')}</option>
              </select>
            </div>
            <button type="submit" className={secondaryButtonClass}>
              {t('common.submit')}
            </button>
          </form>
        </div>

        {/* Mobile: stacked cards */}
        <ul className="mt-4 space-y-3 sm:hidden">
          {applications.map((application) => (
            <li
              key={application.id}
              data-testid={`case-row-${application.id}`}
              className="rounded-2xl bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[var(--color-navy)]">
                  {application.client.firstName} {application.client.lastName}
                </span>
                <StatusBadge status={application.status} />
              </div>
              <p className="mt-1 text-sm text-[var(--color-navy)]/70">
                {t('simulator.amountLabel')}: {application.amount.toLocaleString('fr-CA')} $
              </p>
              <Link
                href={`/admin/applications/${application.id}`}
                className="mt-3 block rounded-full border border-[var(--color-navy)] px-4 py-2 text-center text-sm font-bold text-[var(--color-navy)]"
              >
                {t('admin.viewCase')}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop: table */}
        <div className="mt-4 hidden overflow-x-auto rounded-2xl bg-white shadow-sm sm:block">
          <table className="w-full text-left" data-testid="case-list-table">
            <thead>
              <tr className="border-b border-[var(--color-navy)]/10 text-sm text-[var(--color-navy)]/60">
                <th className="px-6 py-3 font-medium">{t('admin.clientColumn')}</th>
                <th className="px-6 py-3 font-medium">{t('simulator.amountLabel')}</th>
                <th className="px-6 py-3 font-medium">{t('admin.statusFilter')}</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <tr
                  key={application.id}
                  data-testid={`case-row-${application.id}`}
                  className="border-b border-[var(--color-navy)]/5 last:border-0"
                >
                  <td className="px-6 py-3">
                    {application.client.firstName} {application.client.lastName}
                  </td>
                  <td className="px-6 py-3">{application.amount.toLocaleString('fr-CA')} $</td>
                  <td className="px-6 py-3">
                    <StatusBadge status={application.status} />
                  </td>
                  <td className="px-6 py-3 text-right">
                    <Link
                      href={`/admin/applications/${application.id}`}
                      className="rounded-full border border-[var(--color-navy)] px-4 py-1 text-sm font-bold text-[var(--color-navy)]"
                    >
                      {t('admin.viewCase')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-sm text-[var(--color-navy)]/60">
          {total} {t('admin.caseListTitle')}
        </p>
      </div>
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
