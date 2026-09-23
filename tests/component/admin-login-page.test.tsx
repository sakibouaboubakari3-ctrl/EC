// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../messages/fr.json';
import StaffLoginPage from '@/app/[locale]/admin/login/page';

describe('StaffLoginPage', () => {
  it('renders email and password fields', () => {
    render(
      <NextIntlClientProvider locale="fr" messages={messages}>
        <StaffLoginPage />
      </NextIntlClientProvider>
    );
    expect(screen.getByLabelText(messages.auth.email)).toBeInTheDocument();
    expect(screen.getByLabelText(messages.auth.password)).toBeInTheDocument();
  });
});
