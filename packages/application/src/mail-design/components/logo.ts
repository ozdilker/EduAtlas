import { escapeAttribute, escapeHtml } from "../escape";
import { mailTheme } from "../theme";
import { renderMailBadge } from "./badge";

/** Public path for the EduAtlas pin mark used in email headers. */
export const MAIL_LOGO_PATH = "/brand/eduatlas-mark.png";

/**
 * Builds an absolute logo URL for email clients (relative paths do not load).
 */
export function resolveMailLogoUrl(siteBaseUrl: string): string {
  const base = siteBaseUrl.trim().replace(/\/+$/, "");
  if (!base) {
    return `https://eduatlas.com.tr${MAIL_LOGO_PATH}`;
  }
  return `${base}${MAIL_LOGO_PATH}`;
}

export type MailLogoOptions = Readonly<{
  /** Absolute https URL to the mark image. */
  readonly logoUrl?: string;
  /** Optional badge shown under the wordmark (e.g. Kurum daveti). */
  readonly badge?: string;
}>;

/**
 * EduAtlas mark + wordmark (+ optional badge) for email headers.
 */
export function renderMailLogo(options: MailLogoOptions = {}): string {
  const t = mailTheme;
  const wordmark = `Edu<span style="color:${t.color.brandRed};">Atlas</span>`;
  const badgeHtml = options.badge?.trim()
    ? `<div style="margin-top:${t.space[4]}px;">${renderMailBadge(options.badge)}</div>`
    : "";

  const logoUrl = options.logoUrl?.trim();
  if (!logoUrl) {
    return `<span style="font-family:${t.font.family};font-size:${t.font.size.xl}px;font-weight:bold;color:${t.color.brandNavy};letter-spacing:0.2px;">${wordmark}</span>${badgeHtml}`;
  }

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td valign="middle" style="padding-right:10px;"><img src="${escapeAttribute(logoUrl)}" width="26" height="26" alt="${escapeHtml("EduAtlas")}" style="display:block;border:0;width:26px;height:26px;"></td>
<td valign="middle" style="font-family:${t.font.family};font-size:${t.font.size.xl}px;font-weight:bold;color:${t.color.brandNavy};letter-spacing:0.2px;">${wordmark}${badgeHtml}</td>
</tr></table>`;
}
