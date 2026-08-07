import { mailTheme } from "../theme";
import { renderMailLogo } from "./logo";

export type MailHeaderOptions = Readonly<{
  readonly badge?: string;
  /** Absolute URL for the EduAtlas mark (left of title). */
  readonly logoUrl?: string;
}>;

/**
 * Minimal white header: logo mark left of EduAtlas + optional badge title.
 */
export function renderMailHeader(options: MailHeaderOptions = {}): string {
  const t = mailTheme;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${t.color.white};border-bottom:1px solid ${t.color.borderGray};">
  <tr>
    <td style="padding:${t.space[24]}px ${t.space[24]}px ${t.space[16]}px;">
      ${renderMailLogo({
        ...(options.logoUrl?.trim() ? { logoUrl: options.logoUrl.trim() } : {}),
        ...(options.badge?.trim() ? { badge: options.badge.trim() } : {}),
      })}
    </td>
  </tr>
</table>`;
}
