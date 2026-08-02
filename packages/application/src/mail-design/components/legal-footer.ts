import { escapeAttribute, escapeHtml } from "../escape";
import { mailTheme } from "../theme";

export type MailLegalFooterOptions = Readonly<{
  readonly notice?: string;
  readonly unsubscribeUrl?: string;
}>;

/**
 * Legal / transactional disclaimer + optional unsubscribe.
 */
export function renderMailLegalFooter(options: MailLegalFooterOptions = {}): string {
  const t = mailTheme;
  const notice =
    options.notice?.trim() ||
    "Bu e-posta EduAtlas üzerinden otomatik gönderilmiştir. Pazarlama içeriği değildir.";
  const unsub = options.unsubscribeUrl?.trim();

  const unsubHtml = unsub
    ? `<p style="margin:${t.space[8]}px 0 0;"><a href="${escapeAttribute(unsub)}" style="color:${t.color.textMuted};text-decoration:underline;">Abonelikten çık</a></p>`
    : "";

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td style="padding:${t.space[8]}px ${t.space[24]}px ${t.space[24]}px;font-family:${t.font.family};font-size:${t.font.size.sm}px;line-height:1.5;color:${t.color.textMuted};text-align:center;">
      <p style="margin:0;">${escapeHtml(notice)}</p>
      ${unsubHtml}
    </td>
  </tr>
</table>`;
}
