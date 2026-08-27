import { escapeAttribute, escapeHtml } from "../escape";
import { mailTheme } from "../theme";

export type MailPrimaryCtaOptions = Readonly<{
  readonly align?: "left" | "center";
  readonly marginTopPx?: number;
}>;

/**
 * Primary CTA — brand red fill (hero / accent actions).
 */
export function renderMailPrimaryCta(
  label: string,
  href: string,
  options: MailPrimaryCtaOptions = {},
): string {
  const t = mailTheme;
  const text = escapeHtml(label.trim());
  const url = escapeAttribute(href.trim());
  if (!text || !url) {
    return "";
  }
  const align = options.align ?? "left";
  const marginTop = options.marginTopPx ?? 0;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:${marginTop}px auto 0;">
<tbody><tr>
<td align="${align}" bgcolor="${t.color.brandRed}" style="border-radius:${t.radius.md}px;">
<a href="${url}" target="_blank" style="display:block;padding:14px 28px;font-family:${t.font.family};font-size:${t.font.size.lg}px;font-weight:bold;color:${t.color.textInverse};text-decoration:none;">
${text}
</a>
</td>
</tr></tbody></table>`;
}
