// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../messages/fr.json';
import LoginPage from '@/app/[locale]/login/page';

describe('LoginPage', () => {
  it('renders email and password fields', () => {
    render(
      <NextIntlClientProvider locale="fr" messages={messages}>
        <LoginPage />
      </NextIntlClientProvider>
    );
    expect(screen.getByLabelText(messages.auth.email)).toBeInTheDocument();
    expect(screen.getByLabelText(messages.auth.password)).toBeInTheDocument();
  });
});
