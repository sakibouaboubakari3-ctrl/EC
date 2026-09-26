import type { EmailClient } from '@/lib/email/brevo-client';
import {
  renderApplicationSubmittedEmail,
  renderApplicationDecisionEmail,
  renderDepositScheduledEmail,
} from '@/lib/email/templates';

type Locale = 'fr' | 'en';

export interface NotifyApplicationSubmittedInput {
  clientEmail: string;
  clientName: string;
  locale: Locale;
  amount: number;
  appUrl: string;
}

export async function notifyApplicationSubmitted(
  client: EmailClient,
  input: NotifyApplicationSubmittedInput
): Promise<void> {
  const htmlContent = renderApplicationSubmittedEmail(input);
  const subject =
    input.locale === 'fr'
      ? 'Votre demande a été reçue — EspaceCredit'
      : 'Your application has been received — EspaceCredit';
  await client.send({
    to: [{ email: input.clientEmail, name: input.clientName }],
    subject,
    htmlContent,
  });
}

export interface NotifyApplicationDecisionInput {
  clientEmail: string;
  clientName: string;
  locale: Locale;
  decision: 'APPROVED' | 'REJECTED';
  reason: string | null;
  appUrl: string;
}

export async function notifyApplicationDecision(
  client: EmailClient,
  input: NotifyApplicationDecisionInput
): Promise<void> {
  const htmlContent = renderApplicationDecisionEmail(input);
  const subject =
    input.decision === 'APPROVED'
      ? input.locale === 'fr'
        ? 'Votre prêt a été approuvé — EspaceCredit'
        : 'Your loan has been approved — EspaceCredit'
      : input.locale === 'fr'
        ? 'Mise à jour de votre demande — EspaceCredit'
        : 'Update on your application — EspaceCredit';
  await client.send({
    to: [{ email: input.clientEmail, name: input.clientName }],
    subject,
    htmlContent,
  });
}

export interface NotifyDepositScheduledInput {
  clientEmail: string;
  clientName: string;
  locale: Locale;
  netAmount: number;
  scheduledDate: Date;
  appUrl: string;
}

export async function notifyDepositScheduled(
  client: EmailClient,
  input: NotifyDepositScheduledInput
): Promise<void> {
  const htmlContent = renderDepositScheduledEmail(input);
  const subject =
    input.locale === 'fr' ? 'Votre dépôt est prévu — EspaceCredit' : 'Your deposit is scheduled — EspaceCredit';
  await client.send({
    to: [{ email: input.clientEmail, name: input.clientName }],
    subject,
    htmlContent,
  });
}
