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
 * When `logoUrl` is set, the image sits to the left of the title block.
 */
export function renderMailLogo(options: MailLogoOptions = {}): string {
  const t = mailTheme;
  const wordmark = `<p style="margin:0;font-family:${t.font.family};font-size:${t.font.size.lg}px;font-weight:700;line-height:1.2;color:${t.color.brandNavy};letter-spacing:-0.02em;">Edu<span style="color:${t.color.brandRed};">Atlas</span></p>`;
  const badgeHtml = options.badge?.trim()
    ? `<div style="margin-top:${t.space[4]}px;">${renderMailBadge(options.badge)}</div>`
    : "";
  const titleBlock = `${wordmark}${badgeHtml}`;

  const logoUrl = options.logoUrl?.trim();
  if (!logoUrl) {
    return titleBlock;
  }

  return `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
  <tr>
    <td valign="middle" style="padding:0 ${t.space[12]}px 0 0;">
      <img src="${escapeAttribute(logoUrl)}" width="52" height="52" alt="${escapeHtml("EduAtlas")}" style="display:block;width:52px;height:52px;border:0;outline:none;text-decoration:none;" />
    </td>
    <td valign="middle" style="padding:0;">
      ${titleBlock}
    </td>
  </tr>
</table>`;
}
