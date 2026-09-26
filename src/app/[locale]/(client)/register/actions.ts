'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { registerClient, EmailAlreadyRegisteredError } from '@/lib/auth/register-client';

export async function registerAction(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const firstName = String(formData.get('firstName') ?? '');
  const lastName = String(formData.get('lastName') ?? '');

  try {
    await registerClient(prisma, { email, password, firstName, lastName, locale: 'fr' });
  } catch (error) {
    if (error instanceof EmailAlreadyRegisteredError) {
      redirect('/register?error=email-taken');
    }
    throw error;
  }
  redirect('/login');
}
