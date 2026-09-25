# EspaceCredit — Document Upload & Verification Design

Status: Approved for planning
Date: 2026-09-25
Depends on: Slice 1 (foundation + end-to-end loan flow), already merged to `master`

## 1. Purpose

Slice 1 proved the end-to-end loan flow (apply → staff decides → client sees outcome) but never collected supporting documents — the `Document` model was scaffolded and unused. This is the first piece of "Slice 2": clients upload the documents a real lender needs (government ID, proof of income, bank statements) after submitting their application, and staff can view them before deciding.

This spec covers document upload, storage, and staff/client visibility only. It explicitly does **not** cover: automatic bank-statement content analysis, a redesigned multi-stage visual progress indicator, e-signature/contract generation, the guarantee fee, or the CRM-style back-office enhancements — each of those is its own follow-up spec.

## 2. Goals

- Let a client upload ID, proof of income, and one-or-more bank statement files to their own submitted application.
- Let staff view and download what a client uploaded, from the existing admin detail page, before approving/rejecting.
- Keep documents genuinely access-controlled: only the owning client and staff can ever retrieve a file, regardless of how Vercel Blob's own URL scheme works.
- Reuse the existing `Document` Prisma model (finalize its shape) rather than introducing a parallel one.

## 3. Non-goals (this spec)

- Automatic analysis/validation of statement content ("is this really 6 months of statements") — a human reviewer judges completeness.
- Any change to the existing 4-step application form's structure, step count, or tests — document upload is additive, living on the dashboard, not inserted into that flow.
- E-signature, contract generation, guarantee fee, deposit scheduling, Brevo emails — separate specs.

## 4. Storage architecture

**Provider:** Vercel Blob Storage, using its standard client-upload pattern for Next.js:

1. The client-side upload widget calls `upload()` from `@vercel/blob/client`, pointing at a server route (`/api/documents/upload`).
2. That route implements `handleUpload`'s `onBeforeGenerateToken` callback: verifies the caller has a valid client session (`clientAuth()`), that the target `applicationId` belongs to that client, and that the requested `type` is one of `ID`/`INCOME_PROOF`/`BANK_STATEMENT`. It restricts `allowedContentTypes` to `application/pdf`, `image/jpeg`, `image/png`, sets a max size of 10MB, and encodes `{ applicationId, type }` into the token's `tokenPayload` so the completion callback knows what it's for.
3. The actual file bytes go straight from the browser to Vercel Blob — they never pass through our server function, avoiding serverless body-size limits.
4. `onUploadCompleted` fires server-side once the blob exists: it parses `tokenPayload`, and creates a `Document` row with `storageKey` set to the blob's `url` (Vercel Blob's own pathname/URL, which is unguessable but NOT treated as a security boundary by this app — see below), `originalFilename`, and `mimeType` from the completed blob's metadata.

**Access control — the actual security boundary:** Vercel Blob URLs are fetchable by anyone who has the URL (no auth check at Vercel's edge). This app never sends a raw blob URL to a browser. All viewing/downloading goes through `GET /api/documents/[id]/download`: this route checks the caller's session (must be the document's owning client, authenticated via `clientAuth()`, or any authenticated staff member via `staffAuth()`), then fetches the file server-side from its stored blob URL and streams it back with the correct `Content-Type`/`Content-Disposition` headers. The blob URL itself never appears in any HTML, API response, or client-side JavaScript.

**New environment variable:** `BLOB_READ_WRITE_TOKEN`, from the user's Vercel project's Storage tab (create a Blob store, copy its token). Required for both local dev and any deployed environment — Vercel Blob has no local emulator, uploads go to the real cloud store even in development.

## 5. Data model

Finalize the existing scaffolded `Document` model:

```prisma
enum DocumentType {
  ID
  INCOME_PROOF
  BANK_STATEMENT
}

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

This requires a migration changing `Document.type` from `String` to the new `DocumentType` enum, and adding `originalFilename`/`mimeType`. The table is currently empty (never populated in Slice 1), so no data migration is needed — a straightforward `DROP COLUMN`/`ADD COLUMN` (or type change) is safe.

## 6. Client-facing flow

On the client dashboard (`/dashboard`, already showing application status), when the client's latest application is not a `DRAFT` (i.e., it's been submitted), a new "Documents" section appears:

- Lists the three required categories (ID, proof of income, bank statements) with upload controls for each.
- ID and proof of income accept a single file each; re-uploading replaces the previous one for that type (delete the old `Document` row and its blob, then create the new one — avoids orphaned duplicates cluttering the list, per the DRY/no-clutter principle already established for this UI).
- Bank statements accept multiple files (one upload control that can be used repeatedly); each upload adds a new `Document` row with type `BANK_STATEMENT`. A short note tells the client to upload at least 6 months' worth — this is guidance text, not a hard client-side or server-side gate; a human reviewer judges sufficiency.
- Each uploaded file shows in a simple list (filename, upload date) with a delete action (client can remove and re-upload before staff has decided).

## 7. Staff-facing flow

On the admin application detail page (`/admin/applications/[id]`, already showing application data and decision controls), a new "Documents" section lists every `Document` row for that application (type, filename, upload date, a download link pointing at `/api/documents/[id]/download`). No automatic completeness check gates the approve/reject buttons — staff decide with the information available, consistent with the human-review approach already agreed for this platform.

## 8. Security & validation

- File type allowlist (PDF/JPG/PNG) and 10MB size cap enforced server-side in `onBeforeGenerateToken` — a request for any other content type or a larger size is rejected before Vercel Blob ever stores anything.
- Ownership check on upload: the `applicationId` in the upload request must belong to the authenticated client's own application (same pattern as `saveStepAction`'s ownership check from Slice 1).
- Ownership/role check on download: the requester must be the owning client or any authenticated staff member (same session mechanisms already built — `clientAuth()`/`staffAuth()`).
- No document content (bytes) ever touches this app's own database — only the Blob storage reference and small metadata fields are stored in Postgres.

## 9. Testing approach

- Unit: the `onBeforeGenerateToken` validation logic (file type/size/ownership checks) extracted as a pure, testable function, following the existing DI-library-function pattern from Slice 1.
- Integration: creating/deleting `Document` rows against the real Neon database, mirroring Slice 1's existing integration-test style.
- Component: the dashboard's document-upload section and the admin detail page's document list, rendering against mocked data (uploads themselves need a real Vercel Blob token, so the actual upload round-trip is verified manually/via the existing e2e pattern rather than mocked in Vitest).
- The existing Playwright e2e spec is NOT modified by this work (per Non-goals — no change to the core apply/decide flow); a new, separate e2e spec can be added later once this ships, if wanted.

## 10. Open items for implementation planning

- The user needs to provide `BLOB_READ_WRITE_TOKEN` before implementation can be verified end-to-end (planning/scaffolding can proceed without it, but the upload round-trip cannot be tested until it's provided).
