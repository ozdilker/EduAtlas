import { escapeHtml } from "../escape";
import { mailTheme } from "../theme";

export type MailStatItem = Readonly<{
  readonly value: string;
  readonly label: string;
}>;

/**
 * Four-up (or N) stats strip under the hero.
 */
export function renderMailStatsRow(items: readonly MailStatItem[]): string {
  const t = mailTheme;
  if (items.length === 0) return "";

  const cells = items
    .map((item, index) => {
      const isLast = index === items.length - 1;
      const border = isLast ? "" : `border-right:1px solid ${t.color.borderGray};`;
      return `<td class="stat-cell stack" width="${Math.floor(100 / items.length)}%" align="center" style="font-family:${t.font.family};${border}">
<p style="margin:0;font-size:${t.font.size.xl}px;font-weight:bold;color:${t.color.text};">${escapeHtml(item.value)}</p>
<p style="margin:4px 0 0 0;font-size:${t.font.size.xs}px;color:${t.color.textMuted};">${escapeHtml(item.label)}</p>
</td>`;
    })
    .join("");

  return `<tr>
<td class="px" style="padding:${t.space[28]}px ${t.layout.contentPadX}px;border-bottom:1px solid ${t.color.borderGray};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tbody><tr>${cells}</tr></tbody></table>
</td>
</tr>`;
}
