import { createBrevoClient, type EmailClient } from '@/lib/email/brevo-client';

export function getEmailClient(): EmailClient {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME ?? 'EspaceCredit';
  if (!apiKey || !senderEmail) {
    throw new Error('BREVO_API_KEY and BREVO_SENDER_EMAIL must be set to send email');
  }
  return createBrevoClient({ apiKey, senderEmail, senderName });
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}
