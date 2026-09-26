'use server';

import { clientSignOut } from '@/lib/auth/client-auth';
import { staffSignOut } from '@/lib/auth/staff-auth';

export async function clientLogoutAction(): Promise<void> {
  await clientSignOut({ redirectTo: '/' });
}

export async function staffLogoutAction(): Promise<void> {
  await staffSignOut({ redirectTo: '/admin/login' });
}
