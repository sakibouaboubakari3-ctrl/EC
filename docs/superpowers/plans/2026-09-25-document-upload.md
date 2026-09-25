# Document Upload & Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a client upload ID, proof of income, and bank statement files to their submitted application, and let staff view/download them from the admin detail page — all documents genuinely access-controlled (not just obscure URLs).

**Architecture:** Vercel Blob private-access storage, uploaded directly from the browser via Vercel's client-upload token pattern (bypassing serverless body-size limits), with a small DI-style library (`src/lib/documents/`) mirroring the existing `src/lib/applications/` pattern, and a single authenticated download route that is the only path any document byte ever flows through.

**Tech Stack:** `@vercel/blob@2.8.0` (already installed and verified against its actual type definitions), Prisma, Next.js Route Handlers + Server Actions, Vitest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-25-document-upload-design.md`

## Global Constraints

- Documents are never reachable via a raw, unauthenticated URL — every read goes through `GET /api/documents/[id]/download`, which checks the caller's session before calling Vercel Blob's `get()`.
- Allowed file types: `application/pdf`, `image/jpeg`, `image/png`. Max size: 10MB.
- Document types are exactly `ID`, `INCOME_PROOF`, `BANK_STATEMENT` (Prisma enum `DocumentType`) — `ID` and `INCOME_PROOF` are single-file-per-application (re-upload replaces the old one); `BANK_STATEMENT` allows multiple files.
- No automatic document-completeness gating on approve/reject — staff decide with whatever is uploaded, consistent with the human-review approach already established for this platform.
- Uses the existing DI-library pattern: functions take `prisma: PrismaClient` as their first parameter rather than importing the singleton, matching `src/lib/applications/*.ts`.
- `BLOB_READ_WRITE_TOKEN` and `BLOB_STORE_ID` already exist in the real `.env` (gitignored) — do not ask for them again, do not overwrite `.env`.

## Review Focus

- A client requests upload/download/delete for an `applicationId` that belongs to a different client — must be rejected, not silently allowed (Task 3, Task 4, Task 6).
- The `type` value in the upload's `clientPayload` isn't one of `ID`/`INCOME_PROOF`/`BANK_STATEMENT` (a forged or buggy request) — must be rejected before a token is ever issued (Task 3).
- Re-uploading a second `ID` or `INCOME_PROOF` document for the same application must replace the first, not leave two rows confusing a reviewer (Task 2, Task 3).
- Deleting a document that no longer exists (double-click, stale page) must not crash — a clean no-op (Task 2, Task 6).
- Downloading a document while unauthenticated, or as a different client than the owner, must be rejected (401/403), not leak the file (Task 4).

---

### Task 1: Finalize the `Document` Prisma model

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_finalize_document_model/migration.sql`
- Test: `tests/integration/documents-schema.test.ts`

**Interfaces:**
- Consumes: nothing new
- Produces: `DocumentType` enum (`ID | INCOME_PROOF | BANK_STATEMENT`), finalized `Document` model (`id, applicationId, type: DocumentType, storageKey, originalFilename, mimeType, uploadedAt`) — every later task in this plan imports these Prisma-generated types

- [ ] **Step 1: Write the failing test**

Create `tests/integration/documents-schema.test.ts`:

```ts
import { describe, it, expect, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';

describe('Document model', () => {
  const email = 'document-schema-test@example.com';

  afterEach(async () => {
    await prisma.document.deleteMany({ where: { application: { client: { email } } } });
    await prisma.loanApplication.deleteMany({ where: { client: { email } } });
    await prisma.client.deleteMany({ where: { email } });
  });

  it('creates a Document with the finalized fields', async () => {
    const client = await prisma.client.create({
      data: { email, passwordHash: 'x', firstName: 'Test', lastName: 'User' },
    });
    const application = await prisma.loanApplication.create({
      data: { clientId: client.id, amount: 100000, termMonths: 36, rate: 0.04, status: 'SUBMITTED' },
    });
    const document = await prisma.document.create({
      data: {
        applicationId: application.id,
        type: 'ID',
        storageKey: 'clients/abc/id.pdf',
        originalFilename: 'passport.pdf',
        mimeType: 'application/pdf',
      },
    });
    expect(document.type).toBe('ID');
    expect(document.originalFilename).toBe('passport.pdf');
    expect(document.mimeType).toBe('application/pdf');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/integration/documents-schema.test.ts`
Expected: FAIL (`type` is currently a plain `String` field that happens to accept `'ID'` as a string — actually this specific assertion may pass by coincidence since `type: String` accepts any string. To confirm this test is meaningful, temporarily also assert `expect(document.originalFilename).toBeDefined()` and confirm it fails with a Prisma validation error today, since `originalFilename`/`mimeType` don't exist yet on the model — Prisma will reject the `create()` call with an "Unknown argument" error before the model change.)

Expected failure: `PrismaClientValidationError: Unknown argument 'originalFilename'`.

- [ ] **Step 3: Update the schema**

In `prisma/schema.prisma`, add this enum near the other enums (after `enum ActorType { ... }`):

```prisma
enum DocumentType {
  ID
  INCOME_PROOF
  BANK_STATEMENT
}
```

Replace the existing `Document` model:

```prisma
model Document {
  id            String          @id @default(cuid())
  applicationId String
  application   LoanApplication @relation(fields: [applicationId], references: [id])
  type          String
  storageKey    String
  uploadedAt    DateTime        @default(now())
}
```

with:

```prisma
model Document {
  id               String          @id @default(cuid())
  applicationId    String
  application      LoanApplication @relation(fields: [applicationId], references: [id])
  type             DocumentType
  storageKey       String
  originalFilename String
  mimeType         String
  uploadedAt       DateTime        @default(now())

  @@index([applicationId])
}
```

- [ ] **Step 4: Generate the migration**

```bash
pnpm exec prisma migrate dev --name finalize_document_model --create-only
```

The `Document` table has never been populated (scaffolded but unused since Slice 1), so this is a safe structural change with no data to migrate. Open the generated `prisma/migrations/<timestamp>_finalize_document_model/migration.sql` and confirm it contains a `CREATE TYPE "DocumentType"`, an `ALTER TABLE "Document" ALTER COLUMN "type" TYPE "DocumentType" USING ("type"::"DocumentType")` (or equivalent drop/recreate), and `ADD COLUMN` statements for `originalFilename`/`mimeType` as `NOT NULL` (Prisma may generate these with a temporary default since the table is empty — if it complains about needing a default for a `NOT NULL` column, that's expected on an empty table and safe to accept, since there are zero existing rows to backfill).

- [ ] **Step 5: Apply the migration**

```bash
pnpm exec prisma migrate deploy
```

(Use `deploy`, not `dev` — `dev` can prompt interactively about schema drift in a way that isn't scriptable; `deploy` applies pending migrations non-interactively.)

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm test tests/integration/documents-schema.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations tests/integration/documents-schema.test.ts
git commit -m "feat: finalize Document model with DocumentType enum"
```

---

### Task 2: Document library functions

**Files:**
- Create: `src/lib/documents/documents.ts`
- Test: `tests/integration/documents.test.ts`

**Interfaces:**
- Consumes: `prisma` types from Task 1 (`DocumentType`)
- Produces: `createDocument(prisma, input): Promise<Document>`, `listDocumentsForApplication(prisma, applicationId): Promise<Document[]>`, `getDocumentById(prisma, documentId): Promise<Document | null>`, `deleteDocument(prisma, documentId): Promise<void>` (no-op if the row doesn't exist), `replaceSingleTypeDocument(prisma, input): Promise<{ created: Document; deleted: Document[] }>`, `authorizeDocumentUpload(prisma, input): Promise<void>` + `InvalidDocumentTypeError`/`ForbiddenError` — consumed by Task 3 (upload route) and Task 6 (dashboard delete action)

- [ ] **Step 1: Write the failing test**

Create `tests/integration/documents.test.ts`:

```ts
import { describe, it, expect, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  createDocument,
  listDocumentsForApplication,
  getDocumentById,
  deleteDocument,
  replaceSingleTypeDocument,
  authorizeDocumentUpload,
  InvalidDocumentTypeError,
  ForbiddenError,
} from '@/lib/documents/documents';

describe('documents library', () => {
  const email = 'documents-lib-test@example.com';

  afterEach(async () => {
    await prisma.document.deleteMany({ where: { application: { client: { email } } } });
    await prisma.loanApplication.deleteMany({ where: { client: { email } } });
    await prisma.client.deleteMany({ where: { email } });
  });

  async function seedApplication() {
    const client = await prisma.client.create({
      data: { email, passwordHash: 'x', firstName: 'Test', lastName: 'User' },
    });
    return prisma.loanApplication.create({
      data: { clientId: client.id, amount: 100000, termMonths: 36, rate: 0.04, status: 'SUBMITTED' },
    });
  }

  it('creates and lists documents for an application', async () => {
    const application = await seedApplication();
    await createDocument(prisma, {
      applicationId: application.id,
      type: 'ID',
      storageKey: 'a/id.pdf',
      originalFilename: 'id.pdf',
      mimeType: 'application/pdf',
    });
    await createDocument(prisma, {
      applicationId: application.id,
      type: 'BANK_STATEMENT',
      storageKey: 'a/jan.pdf',
      originalFilename: 'january.pdf',
      mimeType: 'application/pdf',
    });

    const documents = await listDocumentsForApplication(prisma, application.id);
    expect(documents).toHaveLength(2);
  });

  it('deleteDocument is a no-op when the row does not exist', async () => {
    await expect(deleteDocument(prisma, 'nonexistent-id')).resolves.toBeUndefined();
  });

  it('getDocumentById returns null for a missing row', async () => {
    expect(await getDocumentById(prisma, 'nonexistent-id')).toBeNull();
  });

  it('replaceSingleTypeDocument removes prior ID documents and keeps the new one', async () => {
    const application = await seedApplication();
    const first = await createDocument(prisma, {
      applicationId: application.id,
      type: 'ID',
      storageKey: 'a/old-id.pdf',
      originalFilename: 'old-id.pdf',
      mimeType: 'application/pdf',
    });

    const { created, deleted } = await replaceSingleTypeDocument(prisma, {
      applicationId: application.id,
      type: 'ID',
      storageKey: 'a/new-id.pdf',
      originalFilename: 'new-id.pdf',
      mimeType: 'application/pdf',
    });

    expect(created.storageKey).toBe('a/new-id.pdf');
    expect(deleted.map((d) => d.id)).toEqual([first.id]);

    const remaining = await listDocumentsForApplication(prisma, application.id);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].storageKey).toBe('a/new-id.pdf');
  });

  it('replaceSingleTypeDocument does not touch BANK_STATEMENT documents of other types', async () => {
    const application = await seedApplication();
    await createDocument(prisma, {
      applicationId: application.id,
      type: 'BANK_STATEMENT',
      storageKey: 'a/jan.pdf',
      originalFilename: 'january.pdf',
      mimeType: 'application/pdf',
    });

    await replaceSingleTypeDocument(prisma, {
      applicationId: application.id,
      type: 'ID',
      storageKey: 'a/new-id.pdf',
      originalFilename: 'new-id.pdf',
      mimeType: 'application/pdf',
    });

    const remaining = await listDocumentsForApplication(prisma, application.id);
    expect(remaining).toHaveLength(2);
  });

  it('authorizeDocumentUpload rejects an invalid document type', async () => {
    const application = await seedApplication();
    await expect(
      authorizeDocumentUpload(prisma, {
        clientId: application.clientId,
        applicationId: application.id,
        type: 'SOMETHING_ELSE',
      })
    ).rejects.toThrow(InvalidDocumentTypeError);
  });

  it("authorizeDocumentUpload rejects a client uploading to another client's application", async () => {
    const application = await seedApplication();
    await expect(
      authorizeDocumentUpload(prisma, {
        clientId: 'a-different-client-id',
        applicationId: application.id,
        type: 'ID',
      })
    ).rejects.toThrow(ForbiddenError);
  });

  it('authorizeDocumentUpload resolves for a valid owner and type', async () => {
    const application = await seedApplication();
    await expect(
      authorizeDocumentUpload(prisma, {
        clientId: application.clientId,
        applicationId: application.id,
        type: 'ID',
      })
    ).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/integration/documents.test.ts`
Expected: FAIL (module `@/lib/documents/documents` not found)

- [ ] **Step 3: Implement**

Create `src/lib/documents/documents.ts`:

```ts
import { DocumentType } from '@prisma/client';
import type { PrismaClient, Document } from '@prisma/client';

const DOCUMENT_TYPE_VALUES = Object.values(DocumentType) as string[];

export function isValidDocumentType(value: string): value is DocumentType {
  return DOCUMENT_TYPE_VALUES.includes(value);
}

export interface CreateDocumentInput {
  applicationId: string;
  type: DocumentType;
  storageKey: string;
  originalFilename: string;
  mimeType: string;
}

export async function createDocument(prisma: PrismaClient, input: CreateDocumentInput): Promise<Document> {
  return prisma.document.create({ data: input });
}

export async function listDocumentsForApplication(
  prisma: PrismaClient,
  applicationId: string
): Promise<Document[]> {
  return prisma.document.findMany({
    where: { applicationId },
    orderBy: { uploadedAt: 'desc' },
  });
}

export async function getDocumentById(prisma: PrismaClient, documentId: string): Promise<Document | null> {
  return prisma.document.findUnique({ where: { id: documentId } });
}

export async function deleteDocument(prisma: PrismaClient, documentId: string): Promise<void> {
  await prisma.document.deleteMany({ where: { id: documentId } });
}

const SINGLE_FILE_TYPES: DocumentType[] = ['ID', 'INCOME_PROOF'];

export async function replaceSingleTypeDocument(
  prisma: PrismaClient,
  input: CreateDocumentInput
): Promise<{ created: Document; deleted: Document[] }> {
  const created = await createDocument(prisma, input);

  let deleted: Document[] = [];
  if (SINGLE_FILE_TYPES.includes(input.type)) {
    deleted = await prisma.document.findMany({
      where: { applicationId: input.applicationId, type: input.type, id: { not: created.id } },
    });
    await prisma.document.deleteMany({
      where: { applicationId: input.applicationId, type: input.type, id: { not: created.id } },
    });
  }

  return { created, deleted };
}

export class InvalidDocumentTypeError extends Error {}
export class ForbiddenError extends Error {}

export interface AuthorizeDocumentUploadInput {
  clientId: string;
  applicationId: string;
  type: string;
}

export async function authorizeDocumentUpload(
  prisma: PrismaClient,
  input: AuthorizeDocumentUploadInput
): Promise<void> {
  if (!isValidDocumentType(input.type)) {
    throw new InvalidDocumentTypeError(`Invalid document type: ${input.type}`);
  }
  const application = await prisma.loanApplication.findUniqueOrThrow({
    where: { id: input.applicationId },
  });
  if (application.clientId !== input.clientId) {
    throw new ForbiddenError('Cannot upload a document to another client\'s application');
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test tests/integration/documents.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/documents/documents.ts tests/integration/documents.test.ts
git commit -m "feat: add document library functions"
```

---

### Task 3: Upload size/type constants + upload API route

**Files:**
- Create: `src/lib/documents/upload-validation.ts`
- Create: `src/app/api/documents/upload/route.ts`
- Test: `tests/unit/upload-validation.test.ts`

**Interfaces:**
- Consumes: `prisma` (Task 2's schema), `clientAuth` (Slice 1's `@/lib/auth/client-auth`), `authorizeDocumentUpload`/`isValidDocumentType`/`replaceSingleTypeDocument`/`createDocument`/`InvalidDocumentTypeError`/`ForbiddenError` (all from Task 2's `@/lib/documents/documents`)
- Produces: `ALLOWED_DOCUMENT_MIME_TYPES`, `MAX_DOCUMENT_SIZE_BYTES` from `@/lib/documents/upload-validation`; the `POST /api/documents/upload` route that Task 5's client upload widget calls

- [ ] **Step 1: Write the failing test**

Create `tests/unit/upload-validation.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/upload-validation.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement the constants module**

Create `src/lib/documents/upload-validation.ts`:

```ts
export const ALLOWED_DOCUMENT_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;
export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;
```

(`isValidDocumentType`/`authorizeDocumentUpload` already exist in `@/lib/documents/documents` from Task 2 — this module holds only the upload-specific size/type-allowlist constants, not document-type validation, to avoid defining "which document types are valid" in two places.)

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/upload-validation.test.ts`
Expected: PASS

- [ ] **Step 5: Implement the upload route**

Create `src/app/api/documents/upload/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { prisma } from '@/lib/prisma';
import { clientAuth } from '@/lib/auth/client-auth';
import {
  authorizeDocumentUpload,
  isValidDocumentType,
  replaceSingleTypeDocument,
  createDocument,
  InvalidDocumentTypeError,
  ForbiddenError,
} from '@/lib/documents/documents';
import { ALLOWED_DOCUMENT_MIME_TYPES, MAX_DOCUMENT_SIZE_BYTES } from '@/lib/documents/upload-validation';

interface UploadClientPayload {
  applicationId: string;
  type: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const session = await clientAuth();
        if (!session?.user?.id) {
          throw new Error('Unauthorized');
        }
        if (!clientPayload) {
          throw new Error('Missing upload metadata');
        }
        const { applicationId, type } = JSON.parse(clientPayload) as UploadClientPayload;

        try {
          await authorizeDocumentUpload(prisma, { clientId: session.user.id, applicationId, type });
        } catch (error) {
          if (error instanceof InvalidDocumentTypeError || error instanceof ForbiddenError) {
            throw new Error(error.message);
          }
          throw error;
        }

        return {
          allowedContentTypes: [...ALLOWED_DOCUMENT_MIME_TYPES],
          maximumSizeInBytes: MAX_DOCUMENT_SIZE_BYTES,
          tokenPayload: JSON.stringify({ applicationId, type, originalFilename: pathname }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        if (!tokenPayload) return;
        const { applicationId, type, originalFilename } = JSON.parse(tokenPayload) as {
          applicationId: string;
          type: string;
          originalFilename: string;
        };
        if (!isValidDocumentType(type)) return;

        const input = {
          applicationId,
          type,
          storageKey: blob.pathname,
          originalFilename,
          mimeType: blob.contentType,
        };

        if (type === 'ID' || type === 'INCOME_PROOF') {
          await replaceSingleTypeDocument(prisma, input);
        } else {
          await createDocument(prisma, input);
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
```

- [ ] **Step 6: Verify the build**

Run: `pnpm build`
Expected: build succeeds, `/api/documents/upload` registered as a route.

- [ ] **Step 7: Commit**

```bash
git add src/lib/documents/upload-validation.ts src/app/api/documents/upload/route.ts tests/unit/upload-validation.test.ts
git commit -m "feat: add document upload API route"
```

---

### Task 4: Download API route

**Files:**
- Create: `src/app/api/documents/[id]/download/route.ts`

**Interfaces:**
- Consumes: `getDocumentById` (Task 2), `clientAuth`/`staffAuth` (Slice 1), `get` from `@vercel/blob`
- Produces: `GET /api/documents/[id]/download` — the only path any document byte flows through; consumed by Task 6's admin document list and Task 5's client document list

- [ ] **Step 1: Implement**

Create `src/app/api/documents/[id]/download/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { get } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { clientAuth } from '@/lib/auth/client-auth';
import { staffAuth } from '@/lib/auth/staff-auth';
import { getDocumentById } from '@/lib/documents/documents';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  const document = await getDocumentById(prisma, id);
  if (!document) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const [clientSession, staffSession] = await Promise.all([clientAuth(), staffAuth()]);
  const isOwningClient = clientSession?.user?.id
    ? (await prisma.loanApplication.findUnique({ where: { id: document.applicationId } }))?.clientId ===
      clientSession.user.id
    : false;
  const isStaff = Boolean(staffSession?.user?.id);

  if (!isOwningClient && !isStaff) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const result = await get(document.storageKey, { access: 'private' });
  if (!result || result.statusCode !== 200) {
    return NextResponse.json({ error: 'File not found in storage' }, { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      'Content-Type': document.mimeType,
      'Content-Disposition': `attachment; filename="${document.originalFilename}"`,
    },
  });
}
```

- [ ] **Step 2: Verify the build**

Run: `pnpm build`
Expected: build succeeds, `/api/documents/[id]/download` registered as a route.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/documents/[id]/download/route.ts
git commit -m "feat: add authenticated document download route"
```

---

### Task 5: Client dashboard document upload UI

**Files:**
- Create: `src/components/DocumentUpload.tsx`
- Create: `src/app/[locale]/dashboard/actions.ts`
- Modify: `src/app/[locale]/dashboard/page.tsx`
- Test: `tests/component/DocumentUpload.test.tsx`

**Interfaces:**
- Consumes: `listDocumentsForApplication`/`deleteDocument`/`getDocumentById` (Task 2), `requireClientId`-style ownership pattern (Slice 1)
- Produces: the dashboard's "Documents" section; `deleteDocumentAction(documentId)` Server Action

- [ ] **Step 1: Write the failing component test**

Create `tests/component/DocumentUpload.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/component/DocumentUpload.test.tsx`
Expected: FAIL (module not found)

- [ ] **Step 3: Add message keys**

Add to `messages/fr.json`'s top level (as a new `documents` object, alongside `dashboard`/`admin`):

```json
"documents": {
  "title": "Documents",
  "idLabel": "Pièce d'identité",
  "incomeLabel": "Preuve de revenu",
  "bankStatementLabel": "Relevés bancaires (au moins 6 mois)",
  "upload": "Téléverser",
  "delete": "Supprimer",
  "noFile": "Aucun fichier"
}
```

Add the same structure to `messages/en.json` with English text:

```json
"documents": {
  "title": "Documents",
  "idLabel": "Government ID",
  "incomeLabel": "Proof of income",
  "bankStatementLabel": "Bank statements (at least 6 months)",
  "upload": "Upload",
  "delete": "Delete",
  "noFile": "No file"
}
```

- [ ] **Step 4: Implement the component**

Create `src/components/DocumentUpload.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { upload } from '@vercel/blob/client';
import { useTranslations } from 'next-intl';

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
    const { deleteDocumentAction } = await import('@/app/[locale]/dashboard/actions');
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test tests/component/DocumentUpload.test.tsx`
Expected: PASS

- [ ] **Step 6: Add the delete Server Action**

Create `src/app/[locale]/dashboard/actions.ts`:

```ts
'use server';

import { del } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { clientAuth } from '@/lib/auth/client-auth';
import { getDocumentById, deleteDocument } from '@/lib/documents/documents';

export async function deleteDocumentAction(documentId: string): Promise<void> {
  const session = await clientAuth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const document = await getDocumentById(prisma, documentId);
  if (!document) return;

  const application = await prisma.loanApplication.findUniqueOrThrow({
    where: { id: document.applicationId },
  });
  if (application.clientId !== session.user.id) {
    throw new Error('Forbidden');
  }

  await del(document.storageKey, { access: 'private' });
  await deleteDocument(prisma, documentId);
}
```

- [ ] **Step 7: Wire the section into the dashboard**

In `src/app/[locale]/dashboard/page.tsx`, the async `DashboardPage` currently fetches `application` and passes it to `DashboardView`. Add a documents fetch and pass it through:

```ts
import { listDocumentsForApplication } from '@/lib/documents/documents';
```

After the existing `application` query in `DashboardPage`, add:

```ts
const documents = application
  ? await listDocumentsForApplication(prisma, application.id)
  : [];
```

Pass `documents={documents}` as a new prop to `<DashboardView application={application} documents={documents} />`, and in `DashboardView`'s props type, add `documents: DocumentSummary[]` (import `DocumentSummary` from `@/components/DocumentUpload`). Inside `DashboardView`'s JSX, after the existing status/schedule content and only when `application` is not null, render:

```tsx
<DocumentUpload applicationId={application.id} documents={documents} onDeleted={() => {}} />
```

(`onDeleted` is a no-op here since the page reloads on delete via the same mechanism `handleUpload` uses — keeping this component simple rather than adding client-side state synchronization for a document list that's freshly fetched on every page load.)

- [ ] **Step 8: Verify the build and full test suite**

Run: `pnpm test`
Run: `pnpm build`
Expected: both succeed.

- [ ] **Step 9: Commit**

```bash
git add src/components/DocumentUpload.tsx src/app/[locale]/dashboard/actions.ts src/app/[locale]/dashboard/page.tsx messages/fr.json messages/en.json tests/component/DocumentUpload.test.tsx
git commit -m "feat: add client-facing document upload to the dashboard"
```

---

### Task 6: Admin document list

**Files:**
- Modify: `src/app/[locale]/admin/applications/[id]/page.tsx`

**Interfaces:**
- Consumes: `listDocumentsForApplication` (Task 2)
- Produces: a documents section on the admin detail page, listing filename/type/date with a download link to Task 4's route

- [ ] **Step 1: Fetch and pass documents through**

In `src/app/[locale]/admin/applications/[id]/page.tsx`, the async `ApplicationDetailPage` currently fetches `application` and passes it to `ApplicationDetailView`. Add:

```ts
import { listDocumentsForApplication } from '@/lib/documents/documents';
```

After the existing `application` fetch (and the `if (!application) notFound();` check), add:

```ts
const documents = await listDocumentsForApplication(prisma, application.id);
```

Pass `documents={documents}` as a new prop to `<ApplicationDetailView application={application} documents={documents} approveAction={approveAction} rejectAction={rejectAction} />`, and add `documents: { id: string; type: string; originalFilename: string; uploadedAt: Date }[]` to `ApplicationDetailView`'s props type.

- [ ] **Step 2: Render the list**

Inside `ApplicationDetailView`'s JSX, after the existing `<dl>` of application details and before the decide buttons, add:

```tsx
<section className="mt-4">
  <h2 className="font-[family-name:var(--font-serif)] text-lg text-[var(--color-navy)]">
    {t('documents.title')}
  </h2>
  <ul>
    {documents.map((document) => (
      <li key={document.id}>
        <a href={`/api/documents/${document.id}/download`}>
          {document.type} — {document.originalFilename}
        </a>
      </li>
    ))}
  </ul>
</section>
```

- [ ] **Step 3: Verify the build**

Run: `pnpm build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/admin/applications/[id]/page.tsx
git commit -m "feat: show uploaded documents on the admin detail page"
```

---

### Task 7: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full suite**

```bash
pnpm lint
pnpm test
pnpm build
```

Expected: all three succeed. (`pnpm test:e2e` is not re-run here — Non-goals §3 of the spec explicitly keeps this work out of the existing e2e spec's scope; a new e2e spec covering document upload can be added later once a real Vercel Blob round-trip can be exercised in CI.)

- [ ] **Step 2: Manually verify one real upload**

With the dev server running (`pnpm dev`) and a real submitted application in the dashboard, upload a small PDF for each of the three document types through the browser, confirm each appears in the list, click download and confirm the file opens correctly, then check the admin detail page for the same application shows all three documents with working download links.

- [ ] **Step 3: Commit**

If Step 2 surfaces no issues, there's nothing new to commit — this task is verification-only. If it does surface an issue, fix it, re-run Steps 1-2, and commit the fix with a message describing what was wrong.
