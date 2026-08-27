import {
  renderMailFooter,
  type MailFooterOptions,
  renderMailHeader,
} from "./components";
import { escapeHtml } from "./escape";
import { mailTheme } from "./theme";

export type MailLayoutSlots = Readonly<{
  readonly subject: string;
  readonly preview: string;
  /** Full-width table rows (`<tr>...</tr>`) for the 600px shell. */
  readonly bodyHtml: string;
  readonly badge?: string;
  readonly logoUrl?: string;
  readonly tagline?: string;
  readonly footer?: MailFooterOptions;
  /** @deprecated Legal copy lives in footer; kept for API compatibility. */
  readonly legalNotice?: string;
  readonly unsubscribeUrl?: string;
}>;

/**
 * Growth Center HTML shell: wash, 600px card, header, body rows, footer.
 */
export function renderMailLayout(slots: MailLayoutSlots): string {
  const t = mailTheme;
  const subject = escapeHtml(slots.subject.trim());
  const preview = escapeHtml(slots.preview.trim());
  const footerOpts: MailFooterOptions = {
    ...slots.footer,
    unsubscribeUrl: slots.unsubscribeUrl ?? slots.footer?.unsubscribeUrl,
    ...(slots.legalNotice?.trim() ? { notice: slots.legalNotice.trim() } : {}),
  };

  const header = renderMailHeader({
    badge: slots.badge,
    logoUrl: slots.logoUrl,
    tagline: slots.tagline,
  });
  const footer = renderMailFooter(footerOpts);
  const brandBar = `<tr><td style="background-color:${t.color.brandTeal};font-size:1px;line-height:4px;height:4px;">&nbsp;</td></tr>`;

  return `<!DOCTYPE html>
<html lang="tr"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${subject}</title>
<!--[if mso]>
<style type="text/css">
table {border-collapse: collapse;}
</style>
<![endif]-->
<style>
  body, table, td { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  img { -ms-interpolation-mode: bicubic; }
  @media only screen and (max-width: 620px) {
    .wrapper { width: 100% !important; }
    .stack { display: block !important; width: 100% !important; }
    .px { padding-left: 20px !important; padding-right: 20px !important; }
    .h1 { font-size: 26px !important; line-height: 32px !important; }
    .stat-cell { display: block !important; width: 100% !important; border-right: none !important; border-bottom: 1px solid ${t.color.borderSoft} !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${t.color.lightGray};mso-line-height-rule:exactly;">
<span style="display:none;font-size:1px;color:${t.color.lightGray};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
${preview}
</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${t.color.lightGray};">
<tbody><tr>
<td align="center" style="padding:${t.space[32]}px ${t.space[16]}px;">
<table role="presentation" class="wrapper" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:${t.layout.maxWidthPx}px;background-color:${t.color.white};border-radius:${t.radius.xl}px;overflow:hidden;">
<tbody>
${header}
${brandBar}
${slots.bodyHtml}
${footer}
</tbody></table>
</td>
</tr></tbody></table>
</body></html>`;
}
