// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../messages/fr.json';

vi.mock('@/lib/auth/client-auth', () => ({
  clientAuth: vi.fn().mockResolvedValue({ user: { id: 'client-1' } }),
}));

const findFirstMock = vi.fn();
const documentFindManyMock = vi.fn().mockResolvedValue([]);
vi.mock('@/lib/prisma', () => ({
  prisma: {
    loanApplication: { findFirst: (...args: unknown[]) => findFirstMock(...args) },
    document: { findMany: (...args: unknown[]) => documentFindManyMock(...args) },
  },
}));

import DashboardPage from '@/app/[locale]/dashboard/page';

describe('DashboardPage', () => {
  it('shows the schedule when the application is approved', async () => {
    findFirstMock.mockResolvedValue({
      status: 'APPROVED',
      decisionReason: null,
      schedule: [{ id: 's1', dueDate: new Date('2026-03-01'), amount: 500 }],
    });
    const Page = await DashboardPage();
    render(
      <NextIntlClientProvider locale="fr" messages={messages}>
        {Page}
      </NextIntlClientProvider>
    );
    expect(screen.getByTestId('application-status')).toHaveTextContent(messages.dashboard.statusApproved);
    expect(screen.getByTestId('schedule-table')).toBeInTheDocument();
  });

  it('shows the rejection reason when rejected', async () => {
    findFirstMock.mockResolvedValue({
      status: 'REJECTED',
      decisionReason: 'Insufficient income',
      schedule: [],
    });
    const Page = await DashboardPage();
    render(
      <NextIntlClientProvider locale="fr" messages={messages}>
        {Page}
      </NextIntlClientProvider>
    );
    expect(screen.getByTestId('application-status')).toHaveTextContent(messages.dashboard.statusRejected);
    expect(screen.getByTestId('decision-reason')).toHaveTextContent('Insufficient income');
  });
});
