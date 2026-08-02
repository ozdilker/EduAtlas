import { mailTheme } from "../theme";

/**
 * Rounded content card wrapper.
 */
export function renderMailCard(innerHtml: string): string {
  const t = mailTheme;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${t.color.white};border:1px solid ${t.color.borderGray};border-radius:${t.radius.lg}px;box-shadow:${t.shadow.card};">
  <tr>
    <td style="padding:${t.space[28]}px ${t.space[24]}px;">
      ${innerHtml}
    </td>
  </tr>
</table>`;
}
