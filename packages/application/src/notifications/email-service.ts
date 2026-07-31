/**
 * Email delivery port — providers (SMTP, SES, console) implement this.
 * No provider-specific logic outside infrastructure adapters.
 */
/** Default transactional From address (Growth / claim-invite mail). */
export const EDUATLAS_MAIL_FROM_DEFAULT = "info@eduatlas.com";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /**
   * Envelope From. Claim-invite mail MUST use `info@eduatlas.com`
   * (or `EDUATLAS_MAIL_FROM` when wired by the host).
   */
  from?: string;
  /** Optional idempotency / correlation key for providers. */
  messageId?: string;
};

export type SendEmailResult = Readonly<{
  readonly messageId: string;
  readonly accepted: boolean;
}>;

export interface EmailService {
  /** Provider id used in delivery logs (`console`, `smtp`, …). */
  readonly providerName?: string;
  send(input: SendEmailInput): Promise<SendEmailResult>;
}
