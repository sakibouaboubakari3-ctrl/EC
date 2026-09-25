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
