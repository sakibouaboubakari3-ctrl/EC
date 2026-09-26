import { useTranslations } from 'next-intl';
import { statusMessageKey } from '@/lib/status-label';
import type { ApplicationStatus } from '@prisma/client';

const STATUS_COLORS: Record<ApplicationStatus, { background: string; color: string }> = {
  DRAFT: { background: '#e5e7eb', color: '#374151' },
  SUBMITTED: { background: '#dbeafe', color: '#1d4ed8' },
  IN_REVIEW: { background: '#fef3c7', color: '#b45309' },
  APPROVED: { background: '#dcfce7', color: '#15803d' },
  REJECTED: { background: '#fee2e2', color: '#b91c1c' },
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const t = useTranslations();
  const { background, color } = STATUS_COLORS[status];

  return (
    <span
      style={{ backgroundColor: background, color }}
      className="rounded-full px-3 py-1 text-xs font-bold"
    >
      {t(statusMessageKey(status))}
    </span>
  );
}
