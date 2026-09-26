// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../messages/fr.json';
import { SiteHeaderView } from '@/components/layout/SiteHeaderView';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: React.ComponentProps<'a'>) => (
    <a href={typeof href === 'string' ? href : '/'} {...props}>
      {children}
    </a>
  ),
  usePathname: () => '/',
}));

function renderHeader(session: { user: { id: string } } | null) {
  return render(
    <NextIntlClientProvider locale="fr" messages={messages}>
      <SiteHeaderView session={session} />
    </NextIntlClientProvider>
  );
}

describe('SiteHeaderView', () => {
  it('shows login and apply-now links for a guest', () => {
    renderHeader(null);
    expect(screen.getByRole('link', { name: 'Connexion' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Faire une demande' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Mon dossier' })).not.toBeInTheDocument();
  });

  it('shows dashboard link and a logout button for a logged-in client', () => {
    renderHeader({ user: { id: 'client-1' } });
    expect(screen.getByRole('link', { name: 'Mon dossier' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Déconnexion' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Connexion' })).not.toBeInTheDocument();
  });

  it('always renders the logo linking home', () => {
    renderHeader(null);
    const homeLink = screen.getByRole('link', { name: /EspaceCredit/i });
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('renders a language switcher link', () => {
    renderHeader(null);
    expect(screen.getByRole('link', { name: 'English' })).toBeInTheDocument();
  });
});
