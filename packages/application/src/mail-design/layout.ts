import {
  renderMailCard,
  renderMailFooter,
  type MailFooterOptions,
  renderMailHeader,
  renderMailLegalFooter,
} from "./components";
import { escapeHtml } from "./escape";
import { mailTheme } from "./theme";

export type MailLayoutSlots = Readonly<{
  readonly subject: string;
  readonly preview: string;
  readonly bodyHtml: string;
  readonly badge?: string;
  readonly footer?: MailFooterOptions;
  readonly legalNotice?: string;
  readonly unsubscribeUrl?: string;
}>;

/**
 * Full HTML document shell: wash background, 600px container, header, card, footer.
 */
export function renderMailLayout(slots: MailLayoutSlots): string {
  const t = mailTheme;
  const subject = escapeHtml(slots.subject.trim());
  const preview = escapeHtml(slots.preview.trim());
  const footerOpts: MailFooterOptions = {
    ...slots.footer,
    unsubscribeUrl: slots.unsubscribeUrl ?? slots.footer?.unsubscribeUrl,
  };

  const header = renderMailHeader({ badge: slots.badge });
  const card = renderMailCard(slots.bodyHtml);
  const footer = renderMailFooter(footerOpts);
  const legal = renderMailLegalFooter({
    notice: slots.legalNotice,
    unsubscribeUrl: footerOpts.unsubscribeUrl,
  });

  // Subtle CSS-only wash (no images): light gray + soft red tint via stacked backgrounds.
  const outerBg = t.color.lightGray;

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:${outerBg};color:${t.color.text};font-family:${t.font.family};-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${preview}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${outerBg};padding:${t.space[24]}px ${t.space[12]}px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:${t.layout.maxWidthPx}px;width:100%;background:${t.color.white};border-radius:${t.radius.lg}px;overflow:hidden;border:1px solid ${t.color.borderGray};">
          <tr>
            <td>
              ${header}
            </td>
          </tr>
          <tr>
            <td style="padding:${t.space[24]}px ${t.space[16]}px ${t.space[8]}px;">
              ${card}
            </td>
          </tr>
          <tr>
            <td>
              ${footer}
              ${legal}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
