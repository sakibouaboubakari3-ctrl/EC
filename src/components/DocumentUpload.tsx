'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { upload } from '@vercel/blob/client';
import { useTranslations } from 'next-intl';
import { confirmDocumentUploadAction, deleteDocumentAction } from '@/app/[locale]/dashboard/actions';

export interface DocumentSummary {
  id: string;
  type: 'ID' | 'INCOME_PROOF' | 'BANK_STATEMENT';
  originalFilename: string;
  uploadedAt: Date;
}

export interface DocumentUploadProps {
  applicationId: string;
  documents: DocumentSummary[];
}

const ACCEPT = '.pdf,.jpg,.jpeg,.png';

export function DocumentUpload({ applicationId, documents }: DocumentUploadProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(type: DocumentSummary['type'], file: File) {
    setIsUploading(true);
    setError(null);
    try {
      const blob = await upload(`applications/${applicationId}/${type}/${file.name}`, file, {
        access: 'private',
        handleUploadUrl: '/api/documents/upload',
        clientPayload: JSON.stringify({ applicationId, type }),
      });
      await confirmDocumentUploadAction({
        applicationId,
        type,
        storageKey: blob.pathname,
        originalFilename: file.name,
        mimeType: file.type,
      });
      router.refresh();
    } catch {
      setError(t('documents.uploadError'));
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(documentId: string) {
    setError(null);
    try {
      await deleteDocumentAction(documentId);
      router.refresh();
    } catch {
      setError(t('documents.deleteError'));
    }
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
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
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
