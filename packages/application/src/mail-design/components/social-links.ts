import { escapeAttribute, escapeHtml } from "../escape";
import { mailTheme } from "../theme";

export type MailSocialLink = Readonly<{
  readonly label: string;
  readonly href: string;
}>;

/**
 * Optional social link row (text links only — no icons required).
 */
export function renderMailSocialLinks(links: readonly MailSocialLink[]): string {
  const t = mailTheme;
  const items = links
    .map((link) => {
      const label = escapeHtml(link.label.trim());
      const href = escapeAttribute(link.href.trim());
      if (!label || !href) {
        return "";
      }
      return `<a href="${href}" style="color:${t.color.brandNavy};text-decoration:none;font-weight:600;margin:0 ${t.space[8]}px;">${label}</a>`;
    })
    .filter(Boolean);

  if (items.length === 0) {
    return "";
  }

  return `<p style="margin:${t.space[12]}px 0 0;font-family:${t.font.family};font-size:${t.font.size.sm}px;text-align:center;">${items.join(" · ")}</p>`;
}
