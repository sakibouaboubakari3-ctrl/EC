// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../messages/fr.json';
import RegisterPage from '@/app/[locale]/(client)/register/page';

describe('RegisterPage', () => {
  it('renders all required fields', () => {
    render(
      <NextIntlClientProvider locale="fr" messages={messages}>
        <RegisterPage />
      </NextIntlClientProvider>
    );
    expect(screen.getByLabelText(messages.auth.firstName)).toBeInTheDocument();
    expect(screen.getByLabelText(messages.auth.lastName)).toBeInTheDocument();
    expect(screen.getByLabelText(messages.auth.email)).toBeInTheDocument();
    expect(screen.getByLabelText(messages.auth.password)).toBeInTheDocument();
  });
});
