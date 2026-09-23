import { describe, it, expect } from 'vitest';
import { resolveRouteAccess } from '@/lib/auth/route-access';

describe('resolveRouteAccess', () => {
  it('allows a public route with no session', () => {
    expect(resolveRouteAccess('/fr', { hasClientSession: false, hasStaffSession: false })).toEqual({
      redirectTo: null,
    });
  });

  it('redirects to /login for /apply without a client session', () => {
    expect(
      resolveRouteAccess('/fr/apply/loan-details', { hasClientSession: false, hasStaffSession: false })
    ).toEqual({ redirectTo: '/fr/login' });
  });

  it('allows /apply with a client session', () => {
    expect(
      resolveRouteAccess('/en/apply/loan-details', { hasClientSession: true, hasStaffSession: false })
    ).toEqual({ redirectTo: null });
  });

  it('redirects to /dashboard-guarded /login without a client session', () => {
    expect(
      resolveRouteAccess('/fr/dashboard', { hasClientSession: false, hasStaffSession: false })
    ).toEqual({ redirectTo: '/fr/login' });
  });

  it('redirects to /admin/login for /admin without a staff session', () => {
    expect(
      resolveRouteAccess('/fr/admin', { hasClientSession: false, hasStaffSession: false })
    ).toEqual({ redirectTo: '/fr/admin/login' });
  });

  it('does not redirect the admin login page itself', () => {
    expect(
      resolveRouteAccess('/fr/admin/login', { hasClientSession: false, hasStaffSession: false })
    ).toEqual({ redirectTo: null });
  });

  it('allows /admin with a staff session', () => {
    expect(
      resolveRouteAccess('/fr/admin', { hasClientSession: false, hasStaffSession: true })
    ).toEqual({ redirectTo: null });
  });
});
