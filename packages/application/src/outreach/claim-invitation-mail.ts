import {
  escapeHtml,
  mailTheme,
  renderMailDocument,
  renderMailInfoBox,
  renderMailPrimaryCta,
  renderMailSection,
  renderMailSubtitle,
  renderMailTitle,
} from "../mail-design";
import type { RenderedEmail } from "../notifications/email-templates";
import { applyMailTokens } from "./apply-mail-tokens";

export const CLAIM_INVITATION_CTA_LABEL = "Kurum Panelini Aç";

const DEFAULT_BODY_LINES = Object.freeze([
  "EduAtlas, velilerin eğitim kurumu aradığı platformdur. {{institutionName}} profiliniz burada listeleniyor olabilir.",
  "Kurum panelinden bilgilerinizi güncelleyin, gelen talepleri görün ve velilerle doğrudan iletişim kurun.",
]);

const BENEFITS = Object.freeze([
  "Velilerden gelen bilgi taleplerini tek panelden yönetin",
  "Kurum profilinizi ücretsiz sahiplenin ve doğrulayın",
  "İletişim ve konum bilgilerinizi güncel tutun",
  "Arama sonuçlarında güven veren bir kurum görünümü sunun",
]);

export type RenderClaimInvitationMailInput = Readonly<{
  readonly subject: string;
  readonly preheader: string;
  readonly institutionName: string;
  readonly ctaHref: string;
  readonly bodyLines?: readonly string[];
}>;

/**
 * Institution Claim Invitation — EMDS-only composition (no custom HTML shell).
 */
export function renderClaimInvitationMail(
  input: RenderClaimInvitationMailInput,
): RenderedEmail {
  const tokens = { institutionName: input.institutionName };
  const subject = applyMailTokens(input.subject.trim(), tokens);
  const preheader = applyMailTokens(input.preheader.trim(), tokens);
  const ctaHref = input.ctaHref.trim();
  const bodyLines = (input.bodyLines?.length ? input.bodyLines : DEFAULT_BODY_LINES).map(
    (line) => applyMailTokens(line, tokens),
  );

  if (!subject) throw new Error("Claim invitation subject is required.");
  if (!preheader) throw new Error("Claim invitation preheader is required.");
  if (!ctaHref) throw new Error("Claim invitation ctaHref is required.");

  const institutionLabel = tokens.institutionName.trim() || "Kurumunuz";
  const title = `${institutionLabel} için EduAtlas kurum paneli hazır`;
  const subtitle = "Velilerden gelen talepleri kaçırmayın — kurumunuzu ücretsiz sahiplenin.";

  const introText = bodyLines.join(" ");
  const benefitsHtml = BENEFITS.map(
    (line) =>
      `<li style="margin:0 0 ${mailTheme.space[8]}px;font-family:${mailTheme.font.family};font-size:${mailTheme.font.size.md}px;line-height:1.5;color:${mailTheme.color.text};">${escapeHtml(line)}</li>`,
  ).join("");

  const bodyHtml = [
    renderMailTitle(title),
    renderMailSubtitle(subtitle),
    renderMailSection(renderMailInfoBox(introText)),
    renderMailSection(
      `<p style="margin:0 0 ${mailTheme.space[8]}px;font-family:${mailTheme.font.family};font-size:${mailTheme.font.size.sm}px;font-weight:600;color:${mailTheme.color.text};">Avantajlar</p><ul style="margin:0;padding-left:18px;">${benefitsHtml}</ul>`,
    ),
    renderMailPrimaryCta(CLAIM_INVITATION_CTA_LABEL, ctaHref),
  ].join("");

  const text = [
    subject,
    "",
    title,
    subtitle,
    "",
    ...bodyLines,
    "",
    "Avantajlar:",
    ...BENEFITS.map((b) => `- ${b}`),
    "",
    `${CLAIM_INVITATION_CTA_LABEL}: ${ctaHref}`,
  ].join("\n");

  const document = renderMailDocument({
    subject,
    preview: preheader,
    bodyHtml,
    text,
    badge: "Kurum daveti",
  });

  return Object.freeze({
    subject,
    html: document.html,
    text: document.text,
  });
}
