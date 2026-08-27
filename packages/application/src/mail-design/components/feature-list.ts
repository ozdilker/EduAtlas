import { escapeHtml } from "../escape";
import { mailTheme } from "../theme";

export type MailFeatureItem = Readonly<{
  readonly title: string;
  readonly body: string;
  readonly accent?: "teal" | "red";
}>;

export type MailFeatureListOptions = Readonly<{
  readonly eyebrow?: string;
  readonly heading?: string;
  readonly items: readonly MailFeatureItem[];
}>;

/**
 * Bullet feature list with colored square markers.
 */
export function renderMailFeatureList(options: MailFeatureListOptions): string {
  const t = mailTheme;
  if (options.items.length === 0) return "";

  const eyebrow = options.eyebrow?.trim()
    ? `<p style="margin:0 0 4px 0;font-family:${t.font.family};font-size:${t.font.size.xs}px;font-weight:bold;letter-spacing:1.2px;text-transform:uppercase;color:${t.color.brandTeal};">${escapeHtml(options.eyebrow)}</p>`
    : "";
  const heading = options.heading?.trim()
    ? `<h2 style="margin:0 0 ${t.space[20]}px 0;font-family:${t.font.display};font-size:${t.font.size.h2}px;color:${t.color.text};font-weight:normal;">${escapeHtml(options.heading)}</h2>`
    : "";

  const rows = options.items
    .map((item, index) => {
      const isLast = index === options.items.length - 1;
      const color =
        item.accent === "red" ? t.color.brandRed : t.color.brandTeal;
      const bottomPad = isLast ? "0" : `${t.space[20]}px`;
      return `<tr>
<td width="36" valign="top" style="padding:0 14px ${bottomPad} 0;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tbody><tr><td width="8" height="8" bgcolor="${color}" style="border-radius:${t.radius.sm}px;font-size:1px;line-height:1px;">&nbsp;</td></tr></tbody></table>
</td>
<td valign="top" style="padding-bottom:${bottomPad};font-family:${t.font.family};">
<p style="margin:0 0 4px 0;font-size:${t.font.size.lg}px;font-weight:bold;color:${t.color.text};">${escapeHtml(item.title)}</p>
<p style="margin:0;font-size:${t.font.size.md}px;line-height:21px;color:${t.color.textBody};">${escapeHtml(item.body)}</p>
</td>
</tr>`;
    })
    .join("");

  return `<tr>
<td class="px" style="padding:${t.space[32]}px ${t.layout.contentPadX}px 8px ${t.layout.contentPadX}px;">
${eyebrow}
${heading}
</td>
</tr>
<tr>
<td class="px" style="padding:0 ${t.layout.contentPadX}px 8px ${t.layout.contentPadX}px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tbody>${rows}</tbody></table>
</td>
</tr>`;
}
