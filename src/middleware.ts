import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { resolveRouteAccess } from '@/lib/auth/route-access';

const intlMiddleware = createIntlMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const clientToken = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    cookieName: 'client-session-token',
  });
  const staffToken = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    cookieName: 'staff-session-token',
  });

  const decision = resolveRouteAccess(request.nextUrl.pathname, {
    hasClientSession: !!clientToken,
    hasStaffSession: !!staffToken,
  });

  if (decision.redirectTo) {
    return NextResponse.redirect(new URL(decision.redirectTo, request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
