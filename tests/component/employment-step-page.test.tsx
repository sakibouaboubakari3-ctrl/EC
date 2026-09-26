// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../messages/fr.json';

vi.mock('@/app/[locale]/(client)/apply/actions', () => ({
  getDraftApplicationId: vi.fn().mockResolvedValue('app-1'),
}));
vi.mock('@/app/[locale]/(client)/apply/employment/actions', () => ({
  saveEmploymentStepAction: vi.fn(),
}));

import EmploymentPage from '@/app/[locale]/(client)/apply/employment/page';

describe('EmploymentPage', () => {
  it('renders all employment fields', async () => {
    const Page = await EmploymentPage();
    render(
      <NextIntlClientProvider locale="fr" messages={messages}>
        {Page}
      </NextIntlClientProvider>
    );
    expect(screen.getByLabelText(messages.apply.employment.employerName)).toBeInTheDocument();
    expect(screen.getByLabelText(messages.apply.employment.monthlyIncome)).toBeInTheDocument();
    expect(screen.getByLabelText(messages.apply.employment.status)).toBeInTheDocument();
  });
});
