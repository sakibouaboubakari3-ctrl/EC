import { z } from 'zod';
import { MIN_LOAN_AMOUNT, MAX_LOAN_AMOUNT, LOAN_TERMS_MONTHS } from '@/lib/config/loan';

export const loanAmountSchema = z
  .number()
  .min(MIN_LOAN_AMOUNT, `Amount must be at least ${MIN_LOAN_AMOUNT}`)
  .max(MAX_LOAN_AMOUNT, `Amount must be at most ${MAX_LOAN_AMOUNT}`);

export const loanTermSchema = z
  .number()
  .refine((value) => (LOAN_TERMS_MONTHS as readonly number[]).includes(value), {
    message: 'Invalid loan term',
  });

export const loanDetailsStepSchema = z.object({
  amount: loanAmountSchema,
  termMonths: loanTermSchema,
});

export const personalInfoStepSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().min(1),
});

export const employmentStepSchema = z.object({
  employerName: z.string().min(1),
  monthlyIncome: z.number().positive(),
  employmentStatus: z.enum(['EMPLOYED', 'SELF_EMPLOYED', 'UNEMPLOYED', 'RETIRED']),
});

export const applicationFormSchema = loanDetailsStepSchema
  .merge(personalInfoStepSchema)
  .merge(employmentStepSchema);

export type LoanDetailsStep = z.infer<typeof loanDetailsStepSchema>;
export type PersonalInfoStep = z.infer<typeof personalInfoStepSchema>;
export type EmploymentStep = z.infer<typeof employmentStepSchema>;
export type ApplicationFormData = z.infer<typeof applicationFormSchema>;
