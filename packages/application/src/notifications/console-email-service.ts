import type { EmailService, SendEmailInput, SendEmailResult } from "./email-service";

/**
 * Development EmailService — logs payloads; never contacts a provider.
 * Safe default when SMTP/Secrets are not configured.
 */
export class ConsoleEmailService implements EmailService {
  readonly providerName = "console";
  readonly sent: SendEmailInput[] = [];

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    const messageId = input.messageId?.trim() || `console_${Date.now()}`;
    this.sent.push(input);
    if (process.env.NODE_ENV !== "test") {
      console.info("[EmailService:console]", {
        from: input.from,
        to: input.to,
        subject: input.subject,
        messageId,
        textPreview: input.text.slice(0, 160),
      });
    }
    return Object.freeze({ messageId, accepted: true });
  }
}

export function createConsoleEmailService(): ConsoleEmailService {
  return new ConsoleEmailService();
}
