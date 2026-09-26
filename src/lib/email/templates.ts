type Locale = 'fr' | 'en';

const NAVY = '#032551';
const ACCENT = '#31CE54';

function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', { dateStyle: 'long' }).format(date);
}

function formatAmount(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function emailShell(appUrl: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background-color:${NAVY};padding:20px 32px;">
                <img src="${appUrl}/media/logo-symbol.png" alt="EspaceCredit" width="28" height="28" style="vertical-align:middle;" />
                <span style="color:#ffffff;font-size:18px;font-weight:bold;margin-left:10px;vertical-align:middle;">EspaceCredit</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:${NAVY};font-size:15px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;">
                EspaceCredit Inc. — 62, rue du Petit-Champlain, Québec (Québec) G1K 4H4, Canada
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background-color:${ACCENT};color:${NAVY};font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:999px;margin-top:16px;">${label}</a>`;
}

export interface ApplicationSubmittedEmailInput {
  locale: Locale;
  clientName: string;
  amount: number;
  appUrl: string;
}

export function renderApplicationSubmittedEmail(input: ApplicationSubmittedEmailInput): string {
  const amountText = formatAmount(input.amount, input.locale);
  const body =
    input.locale === 'fr'
      ? `<p>Bonjour ${input.clientName},</p>
         <p>Votre demande de prêt de <strong>${amountText}</strong> a bien été reçue. Notre équipe l'examinera et vous répondra sous 24 heures.</p>
         ${button(`${input.appUrl}/fr/dashboard`, 'Suivre ma demande')}`
      : `<p>Hello ${input.clientName},</p>
         <p>Your loan application for <strong>${amountText}</strong> has been received. Our team will review it and respond within 24 hours.</p>
         ${button(`${input.appUrl}/en/dashboard`, 'Track my application')}`;
  return emailShell(input.appUrl, body);
}

export interface ApplicationDecisionEmailInput {
  locale: Locale;
  clientName: string;
  decision: 'APPROVED' | 'REJECTED';
  reason: string | null;
  appUrl: string;
}

export function renderApplicationDecisionEmail(input: ApplicationDecisionEmailInput): string {
  const dashboardUrl = `${input.appUrl}/${input.locale}/dashboard`;

  if (input.decision === 'APPROVED') {
    const body =
      input.locale === 'fr'
        ? `<p>Bonjour ${input.clientName},</p>
           <p>Bonne nouvelle : votre demande a été <strong>approuvée</strong>. Votre échéancier de remboursement est maintenant disponible dans votre espace client.</p>
           ${button(dashboardUrl, 'Voir mon échéancier')}`
        : `<p>Hello ${input.clientName},</p>
           <p>Good news: your application has been <strong>approved</strong>. Your repayment schedule is now available in your client dashboard.</p>
           ${button(dashboardUrl, 'View my schedule')}`;
    return emailShell(input.appUrl, body);
  }

  const reasonLine = input.reason
    ? input.locale === 'fr'
      ? `<p>Motif : ${input.reason}</p>`
      : `<p>Reason: ${input.reason}</p>`
    : '';
  const body =
    input.locale === 'fr'
      ? `<p>Bonjour ${input.clientName},</p>
         <p>Nous sommes désolés de vous informer que votre demande a été <strong>refusée</strong>.</p>
         ${reasonLine}`
      : `<p>Hello ${input.clientName},</p>
         <p>We're sorry to inform you that your application has been <strong>rejected</strong>.</p>
         ${reasonLine}`;
  return emailShell(input.appUrl, body);
}

export interface DepositScheduledEmailInput {
  locale: Locale;
  clientName: string;
  netAmount: number;
  scheduledDate: Date;
  appUrl: string;
}

export function renderDepositScheduledEmail(input: DepositScheduledEmailInput): string {
  const amountText = formatAmount(input.netAmount, input.locale);
  const dateText = formatDate(input.scheduledDate, input.locale);
  const body =
    input.locale === 'fr'
      ? `<p>Bonjour ${input.clientName},</p>
         <p>Merci d'avoir signé votre contrat. Votre dépôt de <strong>${amountText}</strong> est prévu pour le <strong>${dateText}</strong>.</p>
         ${button(`${input.appUrl}/fr/dashboard`, 'Voir mon dossier')}`
      : `<p>Hello ${input.clientName},</p>
         <p>Thank you for signing your contract. Your deposit of <strong>${amountText}</strong> is scheduled for <strong>${dateText}</strong>.</p>
         ${button(`${input.appUrl}/en/dashboard`, 'View my application')}`;
  return emailShell(input.appUrl, body);
}
