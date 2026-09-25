import { describe, it, expect, vi, beforeEach } from 'vitest';

const clientAuthMock = vi.fn();
vi.mock('@/lib/auth/client-auth', () => ({
  clientAuth: (...args: unknown[]) => clientAuthMock(...args),
}));

const staffAuthMock = vi.fn();
vi.mock('@/lib/auth/staff-auth', () => ({
  staffAuth: (...args: unknown[]) => staffAuthMock(...args),
}));

const findUniqueMock = vi.fn();
vi.mock('@/lib/prisma', () => ({
  prisma: { loanApplication: { findUnique: (...args: unknown[]) => findUniqueMock(...args) } },
}));

const getDocumentByIdMock = vi.fn();
vi.mock('@/lib/documents/documents', () => ({
  getDocumentById: (...args: unknown[]) => getDocumentByIdMock(...args),
}));

const blobGetMock = vi.fn();
vi.mock('@vercel/blob', () => ({
  get: (...args: unknown[]) => blobGetMock(...args),
}));

import { GET } from '@/app/api/documents/[id]/download/route';

const document = {
  id: 'doc-1',
  applicationId: 'app-1',
  storageKey: 'applications/app-1/ID/passport.pdf',
  originalFilename: 'passport.pdf',
  mimeType: 'application/pdf',
};

function callRoute(id: string) {
  return GET(new Request(`http://localhost/api/documents/${id}/download`), {
    params: Promise.resolve({ id }),
  });
}

describe('GET /api/documents/[id]/download', () => {
  beforeEach(() => {
    clientAuthMock.mockReset();
    staffAuthMock.mockReset();
    findUniqueMock.mockReset();
    getDocumentByIdMock.mockReset();
    blobGetMock.mockReset();
  });

  it('returns 404 without touching blob storage when the document does not exist', async () => {
    clientAuthMock.mockResolvedValue(null);
    staffAuthMock.mockResolvedValue(null);
    getDocumentByIdMock.mockResolvedValue(null);

    const response = await callRoute('missing');

    expect(response.status).toBe(404);
    expect(blobGetMock).not.toHaveBeenCalled();
  });

  it('rejects an unauthenticated request for a document that exists', async () => {
    clientAuthMock.mockResolvedValue(null);
    staffAuthMock.mockResolvedValue(null);
    getDocumentByIdMock.mockResolvedValue(document);

    const response = await callRoute('doc-1');

    expect(response.status).toBe(403);
    expect(blobGetMock).not.toHaveBeenCalled();
  });

  it("rejects a different client's request for the document", async () => {
    clientAuthMock.mockResolvedValue({ user: { id: 'someone-else' } });
    staffAuthMock.mockResolvedValue(null);
    getDocumentByIdMock.mockResolvedValue(document);
    findUniqueMock.mockResolvedValue({ clientId: 'owner-client' });

    const response = await callRoute('doc-1');

    expect(response.status).toBe(403);
    expect(blobGetMock).not.toHaveBeenCalled();
  });

  it('allows the owning client and streams the file', async () => {
    clientAuthMock.mockResolvedValue({ user: { id: 'owner-client' } });
    staffAuthMock.mockResolvedValue(null);
    getDocumentByIdMock.mockResolvedValue(document);
    findUniqueMock.mockResolvedValue({ clientId: 'owner-client' });
    blobGetMock.mockResolvedValue({ statusCode: 200, stream: new ReadableStream() });

    const response = await callRoute('doc-1');

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
  });

  it('allows any authenticated staff member regardless of application ownership', async () => {
    clientAuthMock.mockResolvedValue(null);
    staffAuthMock.mockResolvedValue({ user: { id: 'staff-1' } });
    getDocumentByIdMock.mockResolvedValue(document);
    blobGetMock.mockResolvedValue({ statusCode: 200, stream: new ReadableStream() });

    const response = await callRoute('doc-1');

    expect(response.status).toBe(200);
  });
});
