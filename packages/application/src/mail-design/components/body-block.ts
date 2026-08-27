import { escapeHtml } from "../escape";
import { mailTheme } from "../theme";
import { renderMailSecondaryCta } from "./secondary-cta";

export type MailBodyBlockOptions = Readonly<{
  readonly title?: string;
  readonly bodyLines: readonly string[];
  readonly ctaLabel?: string;
  readonly ctaHref?: string;
}>;

/**
 * Padded content block for generic Growth Center / transactional mails.
 */
export function renderMailBodyBlock(options: MailBodyBlockOptions): string {
  const t = mailTheme;
  const padX = t.layout.contentPadX;
  const title = options.title?.trim()
    ? `<h1 class="h1" style="margin:0 0 ${t.space[16]}px 0;font-family:${t.font.display};font-size:${t.font.size.h2}px;line-height:28px;font-weight:normal;color:${t.color.text};">${escapeHtml(options.title)}</h1>`
    : "";

  const paragraphs = options.bodyLines
    .map((line) => line.trim())
    .filter(Boolean)
    .map(
      (line) =>
        `<p style="margin:0 0 ${t.space[12]}px 0;font-family:${t.font.family};font-size:${t.font.size.md}px;line-height:21px;color:${t.color.textBody};">${escapeHtml(line)}</p>`,
    )
    .join("");

  const cta =
    options.ctaLabel && options.ctaHref
      ? `<div style="margin-top:${t.space[24]}px;">${renderMailSecondaryCta(options.ctaLabel, options.ctaHref, { align: "left" })}</div>`
      : "";

  return `<tr>
<td class="px" style="padding:${t.space[32]}px ${padX}px ${t.space[40]}px ${padX}px;">
${title}
${paragraphs}
${cta}
</td>
</tr>`;
}
