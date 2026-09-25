import { describe, it, expect } from 'vitest';
import { ALLOWED_DOCUMENT_MIME_TYPES, MAX_DOCUMENT_SIZE_BYTES } from '@/lib/documents/upload-validation';

describe('upload constants', () => {
  it('allows exactly PDF, JPEG, and PNG', () => {
    expect(ALLOWED_DOCUMENT_MIME_TYPES).toEqual(['application/pdf', 'image/jpeg', 'image/png']);
  });

  it('caps size at 10MB', () => {
    expect(MAX_DOCUMENT_SIZE_BYTES).toBe(10 * 1024 * 1024);
  });
});
