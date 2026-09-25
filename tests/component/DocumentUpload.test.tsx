// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../messages/fr.json';
import { DocumentUpload } from '@/components/DocumentUpload';

vi.mock('@vercel/blob/client', () => ({
  upload: vi.fn(),
}));

describe('DocumentUpload', () => {
  it('renders an upload control for each required document type', () => {
    render(
      <NextIntlClientProvider locale="fr" messages={messages}>
        <DocumentUpload
          applicationId="app-1"
          documents={[]}
          onDeleted={() => {}}
        />
      </NextIntlClientProvider>
    );
    expect(screen.getByLabelText(/id-upload/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/income-upload/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bank-statement-upload/i)).toBeInTheDocument();
  });

  it('lists already-uploaded documents with a delete button', () => {
    render(
      <NextIntlClientProvider locale="fr" messages={messages}>
        <DocumentUpload
          applicationId="app-1"
          documents={[
            {
              id: 'doc-1',
              type: 'BANK_STATEMENT',
              originalFilename: 'january.pdf',
              uploadedAt: new Date('2026-01-15'),
            },
          ]}
          onDeleted={() => {}}
        />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('january.pdf')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /supprimer/i })).toBeInTheDocument();
  });
});
