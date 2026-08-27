import { escapeAttribute, escapeHtml } from "../escape";
import { mailTheme } from "../theme";

export type MailFooterOptions = Readonly<{
  readonly contactEmail?: string;
  readonly contactPhone?: string;
  readonly websiteUrl?: string;
  readonly address?: string;
  readonly copyright?: string;
  readonly unsubscribeUrl?: string;
  readonly privacyUrl?: string;
  readonly kvkkUrl?: string;
  readonly notice?: string;
}>;

const DEFAULT_WEBSITE = "https://eduatlas.com.tr";
const DEFAULT_CONTACT = "info@eduatlas.com.tr";
const DEFAULT_PHONE = "0541 599 34 14";
const DEFAULT_ADDRESS = "Zuhuratbaba Mah. Kubilay Sok., Bakırköy, İstanbul, 34147";

/**
 * Growth Center footer: brand block, contact, legal links.
 */
export function renderMailFooter(options: MailFooterOptions = {}): string {
  const t = mailTheme;
  const website = (options.websiteUrl ?? DEFAULT_WEBSITE).trim() || DEFAULT_WEBSITE;
  const contact = (options.contactEmail ?? DEFAULT_CONTACT).trim() || DEFAULT_CONTACT;
  const phone = (options.contactPhone ?? DEFAULT_PHONE).trim() || DEFAULT_PHONE;
  const address = (options.address ?? DEFAULT_ADDRESS).trim() || DEFAULT_ADDRESS;
  const copyright =
    options.copyright?.trim() ||
    `© ${new Date().getFullYear()} EduAtlas. Tüm hakları saklıdır.`;
  const notice =
    options.notice?.trim() ||
    "Bu e-postayı EduAtlas kurum güncellemelerine kayıtlı olduğunuz için aldınız.";
  const unsub =
    options.unsubscribeUrl?.trim() || `${website.replace(/\/+$/, "")}/unsubscribe`;
  const privacy = options.privacyUrl?.trim() || `${website.replace(/\/+$/, "")}/privacy`;
  const kvkk = options.kvkkUrl?.trim() || `${website.replace(/\/+$/, "")}/kvkk`;
  const padX = t.layout.contentPadX;

  return `<tr>
<td style="background-color:${t.color.footerBg};padding:${t.space[28]}px ${padX}px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tbody><tr>
<td style="font-family:${t.font.family};font-size:${t.font.size.sm}px;color:${t.color.textFaint};line-height:19px;">
<strong style="color:${t.color.footerText};">EduAtlas</strong><br>
${escapeHtml(address)}<br>
<a href="mailto:${escapeAttribute(contact)}" style="color:${t.color.textFaint};text-decoration:underline;">${escapeHtml(contact)}</a> · ${escapeHtml(phone)}
</td>
</tr>
<tr><td style="padding-top:${t.space[16]}px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tbody><tr><td style="border-top:1px solid ${t.color.borderSoft};font-size:1px;line-height:1px;" width="100%">&nbsp;</td></tr></tbody></table></td></tr>
<tr>
<td style="padding-top:${t.space[14]}px;font-family:${t.font.family};font-size:${t.font.size.xs}px;color:${t.color.textLegal};line-height:18px;">
${escapeHtml(notice)}
<a href="${escapeAttribute(unsub)}" style="color:${t.color.textFaint};">Aboneliği yönet</a> ·
<a href="${escapeAttribute(privacy)}" style="color:${t.color.textFaint};">Gizlilik Politikası</a> ·
<a href="${escapeAttribute(kvkk)}" style="color:${t.color.textFaint};">KVKK</a><br>
${escapeHtml(copyright)}
</td>
</tr></tbody></table>
</td>
</tr>`;
}
