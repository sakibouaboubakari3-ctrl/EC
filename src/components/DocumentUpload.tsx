'use client';

import { useState } from 'react';
import { upload } from '@vercel/blob/client';
import { useTranslations } from 'next-intl';
import { deleteDocumentAction } from '@/app/[locale]/dashboard/actions';

export interface DocumentSummary {
  id: string;
  type: 'ID' | 'INCOME_PROOF' | 'BANK_STATEMENT';
  originalFilename: string;
  uploadedAt: Date;
}

export interface DocumentUploadProps {
  applicationId: string;
  documents: DocumentSummary[];
  onDeleted: (documentId: string) => void;
}

const ACCEPT = '.pdf,.jpg,.jpeg,.png';

export function DocumentUpload({ applicationId, documents, onDeleted }: DocumentUploadProps) {
  const t = useTranslations();
  const [isUploading, setIsUploading] = useState(false);

  async function handleUpload(type: DocumentSummary['type'], file: File) {
    setIsUploading(true);
    try {
      await upload(file.name, file, {
        access: 'private',
        handleUploadUrl: '/api/documents/upload',
        clientPayload: JSON.stringify({ applicationId, type }),
      });
    } finally {
      setIsUploading(false);
      window.location.reload();
    }
  }

  async function handleDelete(documentId: string) {
    await deleteDocumentAction(documentId);
    onDeleted(documentId);
  }

  function renderUploadControl(type: DocumentSummary['type'], label: string, testLabel: string) {
    return (
      <div>
        <label htmlFor={`${type}-input`} aria-label={testLabel}>
          {label}
        </label>
        <input
          id={`${type}-input`}
          type="file"
          accept={ACCEPT}
          disabled={isUploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleUpload(type, file);
          }}
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="font-[family-name:var(--font-serif)] text-lg text-[var(--color-navy)]">
        {t('documents.title')}
      </h2>
      {renderUploadControl('ID', t('documents.idLabel'), 'id-upload')}
      {renderUploadControl('INCOME_PROOF', t('documents.incomeLabel'), 'income-upload')}
      {renderUploadControl('BANK_STATEMENT', t('documents.bankStatementLabel'), 'bank-statement-upload')}

      <ul className="mt-4">
        {documents.map((document) => (
          <li key={document.id} className="flex items-center justify-between py-1">
            <a href={`/api/documents/${document.id}/download`}>{document.originalFilename}</a>
            <button type="button" onClick={() => handleDelete(document.id)}>
              {t('documents.delete')}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
