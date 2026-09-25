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
