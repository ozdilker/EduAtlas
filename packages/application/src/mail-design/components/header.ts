import { mailTheme } from "../theme";
import { renderMailLogo } from "./logo";

export type MailHeaderOptions = Readonly<{
  readonly badge?: string;
  /** Absolute URL for the EduAtlas mark (left of title). */
  readonly logoUrl?: string;
  /** Right-side tagline; defaults to product line. */
  readonly tagline?: string;
}>;

const DEFAULT_TAGLINE = "Türkiye'nin eğitim atlası";

/**
 * Header: logo + wordmark left, tagline right (Growth Center template).
 */
export function renderMailHeader(options: MailHeaderOptions = {}): string {
  const t = mailTheme;
  const tagline = options.tagline?.trim() || DEFAULT_TAGLINE;
  const padX = t.layout.contentPadX;

  return `<tr>
<td class="px" style="padding:${t.space[28]}px ${padX}px ${t.space[20]}px ${padX}px;border-bottom:1px solid ${t.color.borderGray};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tbody><tr>
<td align="left">
${renderMailLogo({
  ...(options.logoUrl?.trim() ? { logoUrl: options.logoUrl.trim() } : {}),
  ...(options.badge?.trim() ? { badge: options.badge.trim() } : {}),
})}
</td>
<td align="right" style="font-family:${t.font.family};font-size:${t.font.size.sm}px;color:${t.color.textMuted};">
${tagline}
</td>
</tr></tbody></table>
</td>
</tr>`;
}
