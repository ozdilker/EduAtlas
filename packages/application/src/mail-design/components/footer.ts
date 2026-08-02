import { escapeAttribute, escapeHtml } from "../escape";
import { mailTheme } from "../theme";

export type MailFooterOptions = Readonly<{
  readonly contactEmail?: string;
  readonly websiteUrl?: string;
  readonly address?: string;
  readonly copyright?: string;
  readonly unsubscribeUrl?: string;
}>;

const DEFAULT_WEBSITE = "https://eduatlas.com.tr";
const DEFAULT_CONTACT = "info@eduatlas.com";

/**
 * Contact / website / address footer block.
 */
export function renderMailFooter(options: MailFooterOptions = {}): string {
  const t = mailTheme;
  const website = (options.websiteUrl ?? DEFAULT_WEBSITE).trim() || DEFAULT_WEBSITE;
  const contact = (options.contactEmail ?? DEFAULT_CONTACT).trim() || DEFAULT_CONTACT;
  const address = options.address?.trim();
  const copyright =
    options.copyright?.trim() ||
    `© ${new Date().getFullYear()} EduAtlas. Tüm hakları saklıdır.`;

  const rows: string[] = [
    `<a href="${escapeAttribute(website)}" style="color:${t.color.brandRed};text-decoration:none;font-weight:600;">${escapeHtml(website.replace(/^https?:\/\//, ""))}</a>`,
    `<a href="mailto:${escapeAttribute(contact)}" style="color:${t.color.textMuted};text-decoration:none;">${escapeHtml(contact)}</a>`,
  ];
  if (address) {
    rows.push(escapeHtml(address));
  }
  rows.push(escapeHtml(copyright));

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:${t.space[24]}px;">
  <tr>
    <td style="padding:${t.space[16]}px ${t.space[24]}px 0;font-family:${t.font.family};font-size:${t.font.size.sm}px;line-height:1.6;color:${t.color.textMuted};text-align:center;">
      ${rows.map((row) => `<p style="margin:0 0 ${t.space[8]}px;">${row}</p>`).join("")}
    </td>
  </tr>
</table>`;
}
