import { mailTheme } from "../theme";
import { renderMailBadge } from "./badge";
import { renderMailLogo } from "./logo";

export type MailHeaderOptions = Readonly<{
  readonly badge?: string;
}>;

/**
 * Minimal white header: logo + optional badge.
 */
export function renderMailHeader(options: MailHeaderOptions = {}): string {
  const t = mailTheme;
  const badge = options.badge?.trim() ? renderMailBadge(options.badge) : "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${t.color.white};border-bottom:1px solid ${t.color.borderGray};">
  <tr>
    <td style="padding:${t.space[24]}px ${t.space[24]}px ${t.space[16]}px;">
      ${renderMailLogo()}
      ${badge}
    </td>
  </tr>
</table>`;
}
