export interface SessionFlags {
  hasClientSession: boolean;
  hasStaffSession: boolean;
}

export interface RouteAccessDecision {
  redirectTo: string | null;
}

const LOCALE_PREFIX = /^\/(fr|en)/;

function stripLocale(pathname: string): string {
  return pathname.replace(LOCALE_PREFIX, '') || '/';
}

export function resolveRouteAccess(pathname: string, flags: SessionFlags): RouteAccessDecision {
  const path = stripLocale(pathname);
  const locale = pathname.match(LOCALE_PREFIX)?.[1] ?? 'fr';

  const isAdminRoute = path.startsWith('/admin') && path !== '/admin/login';
  const isClientProtectedRoute = path.startsWith('/apply') || path.startsWith('/dashboard');

  if (isAdminRoute && !flags.hasStaffSession) {
    return { redirectTo: `/${locale}/admin/login` };
  }
  if (isClientProtectedRoute && !flags.hasClientSession) {
    return { redirectTo: `/${locale}/login` };
  }
  return { redirectTo: null };
}
