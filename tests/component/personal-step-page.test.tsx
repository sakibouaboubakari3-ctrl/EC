// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../messages/fr.json';

vi.mock('@/app/[locale]/(client)/apply/actions', () => ({
  getDraftApplicationId: vi.fn().mockResolvedValue('app-1'),
}));
vi.mock('@/app/[locale]/(client)/apply/personal/actions', () => ({
  savePersonalStepAction: vi.fn(),
}));

import PersonalInfoPage from '@/app/[locale]/(client)/apply/personal/page';

describe('PersonalInfoPage', () => {
  it('renders all personal-info fields', async () => {
    const Page = await PersonalInfoPage();
    render(
      <NextIntlClientProvider locale="fr" messages={messages}>
        {Page}
      </NextIntlClientProvider>
    );
    expect(screen.getByLabelText(messages.auth.firstName)).toBeInTheDocument();
    expect(screen.getByLabelText(messages.auth.lastName)).toBeInTheDocument();
    expect(screen.getByLabelText(messages.apply.personal.address)).toBeInTheDocument();
    expect(screen.getByLabelText(messages.apply.personal.city)).toBeInTheDocument();
    expect(screen.getByLabelText(messages.apply.personal.postalCode)).toBeInTheDocument();
  });
});
