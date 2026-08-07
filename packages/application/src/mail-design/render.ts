import type { MailFooterOptions } from "./components";
import { renderMailLayout } from "./layout";

export type MailDocumentInput = Readonly<{
  readonly subject: string;
  readonly preview: string;
  readonly bodyHtml: string;
  readonly text: string;
  readonly badge?: string;
  readonly logoUrl?: string;
  readonly footer?: MailFooterOptions;
  readonly legalNotice?: string;
  readonly unsubscribeUrl?: string;
}>;

export type MailDocumentResult = Readonly<{
  readonly html: string;
  readonly text: string;
}>;

/**
 * Composes an EMDS document from body HTML + plain-text fallback.
 */
export function renderMailDocument(input: MailDocumentInput): MailDocumentResult {
  const html = renderMailLayout({
    subject: input.subject,
    preview: input.preview,
    bodyHtml: input.bodyHtml,
    badge: input.badge,
    logoUrl: input.logoUrl,
    footer: input.footer,
    legalNotice: input.legalNotice,
    unsubscribeUrl: input.unsubscribeUrl,
  });

  return Object.freeze({
    html,
    text: input.text,
  });
}
