// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../messages/fr.json';
import { SiteFooter } from '@/components/layout/SiteFooter';

describe('SiteFooter', () => {
  it('shows the company legal name and NEQ number', () => {
    render(
      <NextIntlClientProvider locale="fr" messages={messages}>
        <SiteFooter />
      </NextIntlClientProvider>
    );
    expect(screen.getAllByText(/EspaceCredit Inc\./).length).toBeGreaterThan(0);
    expect(screen.getByText(/1198765432/)).toBeInTheDocument();
  });
});
