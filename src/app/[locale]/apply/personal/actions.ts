'use server';

import { redirect } from 'next/navigation';
import { saveStepAction } from '../actions';

export async function savePersonalStepAction(applicationId: string, formData: FormData) {
  await saveStepAction(applicationId, {
    firstName: String(formData.get('firstName') ?? ''),
    lastName: String(formData.get('lastName') ?? ''),
    dateOfBirth: String(formData.get('dateOfBirth') ?? ''),
    address: String(formData.get('address') ?? ''),
    city: String(formData.get('city') ?? ''),
    postalCode: String(formData.get('postalCode') ?? ''),
  });
  redirect('/apply/employment');
}
