import { escapeAttribute, escapeHtml } from "../escape";
import { mailTheme } from "../theme";

/**
 * Primary CTA — brand red fill, white text, ≥44px height.
 */
export function renderMailPrimaryCta(label: string, href: string): string {
  const t = mailTheme;
  const text = escapeHtml(label.trim());
  const url = escapeAttribute(href.trim());
  if (!text || !url) {
    return "";
  }
  const padY = Math.max(0, Math.ceil((t.cta.minHeightPx - t.font.size.md) / 2));
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:${t.space[24]}px 0 0;">
  <tr>
    <td align="left" style="border-radius:${t.radius.md}px;background:${t.color.brandRed};">
      <a href="${url}" style="display:inline-block;min-height:${t.cta.minHeightPx}px;padding:${padY}px ${t.space[24]}px;font-family:${t.font.family};font-size:${t.font.size.md}px;font-weight:700;line-height:1.2;color:${t.color.textInverse};text-decoration:none;border-radius:${t.radius.md}px;">
        ${text}
      </a>
    </td>
  </tr>
</table>`;
}
