type Locale = 'fr' | 'en';

export const COMPANY_LEGAL_NAME = 'EspaceCredit Inc.';
export const COMPANY_NEQ = '1198765432';
export const COMPANY_ADDRESS = '62, rue du Petit-Champlain, Québec (Québec) G1K 4H4, Canada';

function formatCurrency(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', { dateStyle: 'long' }).format(date);
}

export interface LoanContractInput {
  locale: Locale;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  amount: number;
  termMonths: number;
  annualRate: number;
  monthlyPayment: number;
  feeAmount: number;
  netAmount: number;
  companyRepName: string;
  companyRepTitle: string;
  companySignedAt: Date;
  clientSignedAt: Date | null;
}

export function renderLoanContractHtml(input: LoanContractInput): string {
  const {
    locale,
    clientName,
    clientEmail,
    clientAddress,
    amount,
    termMonths,
    annualRate,
    monthlyPayment,
    feeAmount,
    netAmount,
    companyRepName,
    companyRepTitle,
    companySignedAt,
    clientSignedAt,
  } = input;

  const amountText = formatCurrency(amount, locale);
  const feeText = formatCurrency(feeAmount, locale);
  const netText = formatCurrency(netAmount, locale);
  const paymentText = formatCurrency(monthlyPayment, locale);
  const ratePercent = (annualRate * 100).toFixed(2);
  const companyDateText = formatDate(companySignedAt, locale);

  const clientSignatureBlock = clientSignedAt
    ? locale === 'fr'
      ? `<p><strong>${clientName}</strong><br/>Signé électroniquement le ${formatDate(clientSignedAt, locale)}</p>`
      : `<p><strong>${clientName}</strong><br/>Electronically signed on ${formatDate(clientSignedAt, locale)}</p>`
    : locale === 'fr'
      ? `<p><strong>${clientName}</strong><br/>En attente de signature</p>`
      : `<p><strong>${clientName}</strong><br/>Awaiting signature</p>`;

  if (locale === 'en') {
    return `<!doctype html>
<html>
<head><meta charset="utf-8" /><title>Loan Agreement</title></head>
<body style="font-family:Georgia,serif;color:#032551;max-width:720px;margin:0 auto;padding:32px;line-height:1.6;">
  <h1>Consumer Loan Agreement</h1>
  <p>This Loan Agreement (the "Agreement") is entered into between:</p>
  <p><strong>${COMPANY_LEGAL_NAME}</strong> (NEQ ${COMPANY_NEQ}), having its registered office at ${COMPANY_ADDRESS} (the "Lender"),</p>
  <p>and</p>
  <p><strong>${clientName}</strong>, residing at ${clientAddress}, email ${clientEmail} (the "Borrower").</p>

  <h2>1. Loan Amount and Term</h2>
  <p>The Lender agrees to lend the Borrower the principal amount of <strong>${amountText}</strong> for a term of <strong>${termMonths} months</strong>, at an annual interest rate of <strong>${ratePercent}%</strong>.</p>

  <h2>2. Origination Fee and Net Disbursement</h2>
  <p>An origination fee of <strong>${feeText}</strong> is deducted from the loan proceeds at disbursement. The Borrower will receive a net amount of <strong>${netText}</strong>, while repayment obligations under this Agreement are calculated on the full principal amount of ${amountText}.</p>

  <h2>3. Repayment</h2>
  <p>The Borrower agrees to repay the loan in ${termMonths} equal monthly installments of approximately <strong>${paymentText}</strong>, according to the amortization schedule provided in the Borrower's client dashboard.</p>

  <h2>4. Prepayment</h2>
  <p>The Borrower may prepay any outstanding balance at any time without penalty.</p>

  <h2>5. Default</h2>
  <p>Failure to make a scheduled payment may result in the Lender exercising its remedies under applicable law, including reporting to credit bureaus and pursuing collection.</p>

  <h2>6. Governing Law</h2>
  <p>This Agreement is governed by the laws of the Province of Quebec and the federal laws of Canada applicable therein.</p>

  <h2>7. Electronic Signatures</h2>
  <p>The parties agree that this Agreement may be executed electronically, and that such electronic signatures have the same legal effect as handwritten signatures, in accordance with applicable electronic commerce legislation.</p>

  <h2>Signatures</h2>
  <table style="width:100%;margin-top:24px;">
    <tr>
      <td style="width:50%;vertical-align:top;">
        <p><strong>${COMPANY_LEGAL_NAME}</strong></p>
        <p>Electronically executed by ${companyRepName}, ${companyRepTitle}, on ${companyDateText}, pursuant to the Lender's electronic signature policy and credit approval process.</p>
      </td>
      <td style="width:50%;vertical-align:top;">
        ${clientSignatureBlock}
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  return `<!doctype html>
<html>
<head><meta charset="utf-8" /><title>Contrat de prêt</title></head>
<body style="font-family:Georgia,serif;color:#032551;max-width:720px;margin:0 auto;padding:32px;line-height:1.6;">
  <h1>Contrat de prêt à la consommation</h1>
  <p>Le présent contrat de prêt (le « Contrat ») intervient entre :</p>
  <p><strong>${COMPANY_LEGAL_NAME}</strong> (NEQ ${COMPANY_NEQ}), dont le siège social est situé au ${COMPANY_ADDRESS} (le « Prêteur »),</p>
  <p>et</p>
  <p><strong>${clientName}</strong>, domicilié(e) au ${clientAddress}, courriel ${clientEmail} (l'« Emprunteur »).</p>

  <h2>1. Montant du prêt et durée</h2>
  <p>Le Prêteur consent à prêter à l'Emprunteur la somme principale de <strong>${amountText}</strong> pour une durée de <strong>${termMonths} mois</strong>, à un taux d'intérêt annuel de <strong>${ratePercent}%</strong>.</p>

  <h2>2. Frais de dossier et montant net déposé</h2>
  <p>Des frais de dossier de <strong>${feeText}</strong> sont déduits du montant du prêt au moment du décaissement. L'Emprunteur recevra un montant net de <strong>${netText}</strong>, alors que les obligations de remboursement prévues au présent Contrat sont calculées sur le montant principal complet de ${amountText}.</p>

  <h2>3. Remboursement</h2>
  <p>L'Emprunteur s'engage à rembourser le prêt en ${termMonths} versements mensuels égaux d'environ <strong>${paymentText}</strong>, selon l'échéancier d'amortissement disponible dans son espace client.</p>

  <h2>4. Remboursement anticipé</h2>
  <p>L'Emprunteur peut rembourser par anticipation tout solde impayé en tout temps, sans pénalité.</p>

  <h2>5. Défaut</h2>
  <p>Le défaut d'effectuer un paiement prévu peut entraîner l'exercice par le Prêteur de ses recours prévus par la loi, notamment la déclaration aux bureaux de crédit et le recouvrement.</p>

  <h2>6. Loi applicable</h2>
  <p>Le présent Contrat est régi par les lois de la province de Québec et les lois fédérales du Canada qui s'y appliquent.</p>

  <h2>7. Signatures électroniques</h2>
  <p>Les parties conviennent que le présent Contrat peut être signé électroniquement, et qu'une telle signature électronique a la même valeur juridique qu'une signature manuscrite, conformément à la législation applicable en matière de commerce électronique.</p>

  <h2>Signatures</h2>
  <table style="width:100%;margin-top:24px;">
    <tr>
      <td style="width:50%;vertical-align:top;">
        <p><strong>${COMPANY_LEGAL_NAME}</strong></p>
        <p>Signé électroniquement par ${companyRepName}, ${companyRepTitle}, le ${companyDateText}, conformément à la politique de signature électronique et au processus d'approbation de crédit du Prêteur.</p>
      </td>
      <td style="width:50%;vertical-align:top;">
        ${clientSignatureBlock}
      </td>
    </tr>
  </table>
</body>
</html>`;
}
