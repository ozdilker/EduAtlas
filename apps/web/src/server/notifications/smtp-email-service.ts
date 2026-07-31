import type { EmailService, SendEmailInput, SendEmailResult } from "@eduatlas/application";
import { EDUATLAS_MAIL_FROM_DEFAULT } from "@eduatlas/application";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

export type SmtpEmailServiceOptions = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
};

/**
 * Nodemailer-backed EmailService for real SMTP delivery.
 */
export class SmtpEmailService implements EmailService {
  readonly providerName = "smtp";
  private readonly transporter: Transporter;

  constructor(private readonly options: SmtpEmailServiceOptions) {
    this.transporter = nodemailer.createTransport({
      host: options.host,
      port: options.port,
      secure: options.secure,
      auth: {
        user: options.user,
        pass: options.pass,
      },
    });
  }

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    const from = input.from?.trim() || EDUATLAS_MAIL_FROM_DEFAULT;
    const to = input.to.trim();
    if (!to) {
      throw new Error("SmtpEmailService: recipient (to) is required.");
    }

    const info = await this.transporter.sendMail({
      from,
      to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      messageId: input.messageId?.trim() || undefined,
    });

    const messageId =
      (typeof info.messageId === "string" && info.messageId.trim()) ||
      input.messageId?.trim() ||
      `smtp_${Date.now()}`;

    return Object.freeze({
      messageId,
      accepted: Array.isArray(info.accepted) ? info.accepted.length > 0 : true,
    });
  }
}

export type ResolvedSmtpEnv = Readonly<{
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}>;

/**
 * Reads SMTP settings from process env. Returns null when incomplete
 * (caller should fall back to ConsoleEmailService).
 */
export function readSmtpEnv(
  source: NodeJS.ProcessEnv = process.env,
): ResolvedSmtpEnv | null {
  const host = source.SMTP_HOST?.trim() ?? "";
  const user = source.SMTP_USER?.trim() ?? "";
  const pass = source.SMTP_PASS?.trim() ?? "";
  if (!host || !user || !pass) {
    return null;
  }

  const portRaw = Number.parseInt(source.SMTP_PORT?.trim() || "587", 10);
  const port = Number.isFinite(portRaw) && portRaw > 0 ? portRaw : 587;
  const secureFlag = source.SMTP_SECURE?.trim().toLowerCase();
  const secure =
    secureFlag === "1" ||
    secureFlag === "true" ||
    (secureFlag !== "0" && secureFlag !== "false" && port === 465);

  return Object.freeze({ host, port, secure, user, pass });
}

export function createSmtpEmailService(options: SmtpEmailServiceOptions): SmtpEmailService {
  return new SmtpEmailService(options);
}

export function tryCreateSmtpEmailServiceFromEnv(
  source: NodeJS.ProcessEnv = process.env,
): SmtpEmailService | null {
  const env = readSmtpEnv(source);
  if (!env) return null;
  return createSmtpEmailService(env);
}
