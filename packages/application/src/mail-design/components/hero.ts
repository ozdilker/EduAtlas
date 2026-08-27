import { escapeHtml } from "../escape";
import { mailTheme } from "../theme";
import { renderMailPrimaryCta } from "./primary-cta";

export type MailHeroOptions = Readonly<{
  readonly eyebrow?: string;
  readonly title: string;
  readonly body: string;
  readonly ctaLabel?: string;
  readonly ctaHref?: string;
}>;

/**
 * Teal hero band with display headline + optional red CTA.
 */
export function renderMailHero(options: MailHeroOptions): string {
  const t = mailTheme;
  const title = escapeHtml(options.title.trim());
  const body = escapeHtml(options.body.trim());
  if (!title) return "";

  const eyebrow = options.eyebrow?.trim()
    ? `<p style="margin:0 0 10px 0;font-family:${t.font.family};font-size:${t.font.size.sm}px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:${t.color.textInverse};">${escapeHtml(options.eyebrow)}</p>`
    : "";

  const cta =
    options.ctaLabel && options.ctaHref
      ? renderMailPrimaryCta(options.ctaLabel, options.ctaHref)
      : "";

  return `<tr>
<td style="background-color:${t.color.brandTeal};padding:${t.space[44]}px ${t.layout.contentPadX}px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tbody><tr>
<td align="left">
${eyebrow}
<h1 class="h1" style="margin:0 0 ${t.space[16]}px 0;font-family:${t.font.display};font-size:${t.font.size.hero}px;line-height:38px;font-weight:normal;color:${t.color.textInverse};">
${title}
</h1>
<p style="margin:0 0 26px 0;font-family:${t.font.family};font-size:${t.font.size.lg}px;line-height:24px;color:${t.color.heroMuted};">
${body}
</p>
${cta}
</td>
</tr></tbody></table>
</td>
</tr>`;
}
