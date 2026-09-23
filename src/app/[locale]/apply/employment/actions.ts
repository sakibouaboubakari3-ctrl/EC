'use server';

import { redirect } from 'next/navigation';
import { saveStepAction } from '../actions';

export async function saveEmploymentStepAction(applicationId: string, formData: FormData) {
  await saveStepAction(applicationId, {
    employerName: String(formData.get('employerName') ?? ''),
    monthlyIncome: Number(formData.get('monthlyIncome') ?? 0),
    employmentStatus: String(formData.get('employmentStatus') ?? ''),
  });
  redirect('/apply/review');
}
