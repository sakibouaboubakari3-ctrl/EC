// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../messages/fr.json';
import { StatusBadge } from '@/components/StatusBadge';

function renderBadge(status: 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED') {
  return render(
    <NextIntlClientProvider locale="fr" messages={messages}>
      <StatusBadge status={status} />
    </NextIntlClientProvider>
  );
}

describe('StatusBadge', () => {
  it('shows the localized status label for each status', () => {
    renderBadge('SUBMITTED');
    expect(screen.getByText(messages.dashboard.statusSubmitted)).toBeInTheDocument();
  });

  it('uses a distinct background color per status', () => {
    const { container: submitted } = renderBadge('SUBMITTED');
    const { container: approved } = renderBadge('APPROVED');
    const { container: rejected } = renderBadge('REJECTED');

    const submittedColor = submitted.querySelector('span')?.style.backgroundColor;
    const approvedColor = approved.querySelector('span')?.style.backgroundColor;
    const rejectedColor = rejected.querySelector('span')?.style.backgroundColor;

    expect(submittedColor).toBeTruthy();
    expect(approvedColor).toBeTruthy();
    expect(rejectedColor).toBeTruthy();
    expect(new Set([submittedColor, approvedColor, rejectedColor]).size).toBe(3);
  });
});
