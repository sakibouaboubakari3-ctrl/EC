'use server';

import { redirect } from 'next/navigation';
import { clientSignIn } from '@/lib/auth/client-auth';

export async function clientLoginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  try {
    await clientSignIn('credentials', { email, password, redirect: false });
  } catch {
    redirect('/login?error=invalid-credentials');
  }
  // redirect() throws internally — this line only runs on success
  redirect('/apply/loan-details');
}
