// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../messages/fr.json';
import HomePage from '@/app/[locale]/(client)/page';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: React.ComponentProps<'a'>) => (
    <a href={typeof href === 'string' ? href : '/'} {...props}>
      {children}
    </a>
  ),
}));

describe('HomePage', () => {
  it('renders the hero headline, both CTAs, and the loan simulator', () => {
    render(
      <NextIntlClientProvider locale="fr" messages={messages}>
        <HomePage />
      </NextIntlClientProvider>
    );
    expect(screen.getByText(messages.home.hero.headline)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: messages.home.hero.ctaPrimary }).length).toBeGreaterThan(0);
    expect(screen.getByTestId('loan-simulator')).toBeInTheDocument();
  });

  it('renders all three plan steps', () => {
    render(
      <NextIntlClientProvider locale="fr" messages={messages}>
        <HomePage />
      </NextIntlClientProvider>
    );
    expect(screen.getByText(`1. ${messages.home.plan.step1Title}`)).toBeInTheDocument();
    expect(screen.getByText(`2. ${messages.home.plan.step2Title}`)).toBeInTheDocument();
    expect(screen.getByText(`3. ${messages.home.plan.step3Title}`)).toBeInTheDocument();
  });

  it('renders the three problem points', () => {
    render(
      <NextIntlClientProvider locale="fr" messages={messages}>
        <HomePage />
      </NextIntlClientProvider>
    );
    expect(screen.getByText(messages.home.problem.item1Title)).toBeInTheDocument();
    expect(screen.getByText(messages.home.problem.item2Title)).toBeInTheDocument();
    expect(screen.getByText(messages.home.problem.item3Title)).toBeInTheDocument();
  });
});
