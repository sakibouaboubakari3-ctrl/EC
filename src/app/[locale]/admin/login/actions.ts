'use server';

import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';
import { staffSignIn } from '@/lib/auth/staff-auth';

export async function staffLoginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  try {
    await staffSignIn('credentials', { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect('/admin/login?error=invalid-credentials');
    }
    throw error;
  }
  redirect('/admin');
}
