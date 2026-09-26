// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../messages/fr.json';
import { AdminHeaderView } from '@/components/layout/AdminHeaderView';

function renderHeader(session: { user: { id: string } } | null) {
  return render(
    <NextIntlClientProvider locale="fr" messages={messages}>
      <AdminHeaderView session={session} />
    </NextIntlClientProvider>
  );
}

describe('AdminHeaderView', () => {
  it('shows the staff-portal label', () => {
    renderHeader(null);
    expect(screen.getByText('Espace employé')).toBeInTheDocument();
  });

  it('shows a logout button when staff is logged in', () => {
    renderHeader({ user: { id: 'staff-1' } });
    expect(screen.getByRole('button', { name: 'Déconnexion' })).toBeInTheDocument();
  });

  it('hides the logout button when no staff session exists', () => {
    renderHeader(null);
    expect(screen.queryByRole('button', { name: 'Déconnexion' })).not.toBeInTheDocument();
  });
});
