import { escapeHtml } from "../escape";
import { mailTheme } from "../theme";

export type MailStepItem = Readonly<{
  readonly label: string;
}>;

export type MailStepsBoxOptions = Readonly<{
  readonly eyebrow?: string;
  readonly steps: readonly MailStepItem[];
}>;

/**
 * Numbered steps callout on teal-tinted background.
 */
export function renderMailStepsBox(options: MailStepsBoxOptions): string {
  const t = mailTheme;
  if (options.steps.length === 0) return "";

  const eyebrow = options.eyebrow?.trim()
    ? `<p style="margin:0 0 ${t.space[16]}px 0;font-family:${t.font.family};font-size:${t.font.size.xs}px;font-weight:bold;letter-spacing:1.2px;text-transform:uppercase;color:${t.color.brandTeal};">${escapeHtml(options.eyebrow)}</p>`
    : "";

  const rows = options.steps
    .map((step, index) => {
      const isLast = index === options.steps.length - 1;
      const n = String(index + 1).padStart(2, "0");
      const pad = isLast ? "" : `padding-bottom:${t.space[14]}px;`;
      return `<tr>
<td valign="top" style="${pad}font-family:${t.font.family};">
<span style="display:inline-block;width:22px;font-weight:bold;color:${t.color.text};font-size:${t.font.size.md}px;">${n}</span>
<span style="font-size:${t.font.size.md}px;color:${t.color.footerText};">${escapeHtml(step.label)}</span>
</td>
</tr>`;
    })
    .join("");

  return `<tr>
<td class="px" style="padding:8px ${t.layout.contentPadX}px ${t.space[32]}px ${t.layout.contentPadX}px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${t.color.stepsBg};border-radius:${t.radius.lg}px;">
<tbody><tr>
<td style="padding:${t.space[24]}px;">
${eyebrow}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tbody>${rows}</tbody></table>
</td>
</tr></tbody></table>
</td>
</tr>`;
}
