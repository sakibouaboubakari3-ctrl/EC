export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface SendEmailInput {
  to: EmailRecipient[];
  subject: string;
  htmlContent: string;
}

export interface EmailClient {
  send(input: SendEmailInput): Promise<void>;
}

export interface BrevoClientConfig {
  apiKey: string;
  senderEmail: string;
  senderName: string;
}

export function createBrevoClient(config: BrevoClientConfig): EmailClient {
  return {
    async send(input: SendEmailInput): Promise<void> {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': config.apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sender: { name: config.senderName, email: config.senderEmail },
          to: input.to,
          subject: input.subject,
          htmlContent: input.htmlContent,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Brevo send failed: ${response.status} ${body}`);
      }
    },
  };
}
