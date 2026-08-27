import {
  mailTheme,
  renderMailDocument,
  renderMailFeatureList,
  renderMailHero,
  renderMailSecondaryCta,
  renderMailStatsRow,
  renderMailStepsBox,
  resolveMailLogoUrl,
} from "../mail-design";
import type { RenderedEmail } from "../notifications/email-templates";
import { applyMailTokens } from "./apply-mail-tokens";

export const CLAIM_INVITATION_CTA_LABEL = "Kurumunu Sahiplen →";
export const CLAIM_INVITATION_SECONDARY_CTA_LABEL = "Kurumunu Ücretsiz Sahiplen";

const DEFAULT_BODY_LINES = Object.freeze([
  "Kurumunuz zaten EduAtlas'ta listeleniyor olabilir. Profilinizi sahiplenin; bilgilerinizi siz güncelleyin, doğru ailelere doğru bilgiyle ulaşın.",
]);

const FEATURES = Object.freeze([
  {
    title: "Doğru bilgi, sizden",
    body: "Program, iletişim ve konum bilgilerinizi siz güncelleyin — eksik ya da yanlış bilgi ailelerin kararını etkilemesin.",
    accent: "teal" as const,
  },
  {
    title: "Doğru ailelere erişim",
    body: "Şehrinizde arama yapan, kurumunuzun sunduğu programı arayan ailelerin karşısına çıkın.",
    accent: "red" as const,
  },
  {
    title: "Tek yerden bilgi talepleri",
    body: "İlgilenen aileler tek formla size ulaşsın; dağınık aramalarla değil, doğrudan panelinizden takip edin.",
    accent: "teal" as const,
  },
  {
    title: "Ücretsiz ve hızlı",
    body: "Doğrulama birkaç dakika sürer; kurum belgenizle sahiplenme talebini hemen başlatın.",
    accent: "red" as const,
  },
]);

const STATS = Object.freeze([
  { value: "37.000+", label: "Eğitim Kurumu" },
  { value: "1.250.000+", label: "Mutlu Öğrenci" },
  { value: "81", label: "İlde Hizmet" },
  { value: "4,9 / 5", label: "Kullanıcı Puanı" },
]);

const STEPS = Object.freeze([
  { label: 'Kurumunuzu arayın ve "Kurumunu Sahiplen" ile talebi başlatın.' },
  { label: "Kurum belgenizle kimliğinizi doğrulayın." },
  { label: "Profilinizi güncelleyin, bilgi taleplerini karşılamaya başlayın." },
]);

export type RenderClaimInvitationMailInput = Readonly<{
  readonly subject: string;
  readonly preheader: string;
  readonly institutionName: string;
  readonly ctaHref: string;
  readonly bodyLines?: readonly string[];
  /** Absolute URL for header mark; defaults to production brand asset. */
  readonly logoUrl?: string;
}>;

/**
 * Institution Claim Invitation — Growth Center HTML template composition.
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
  const heroBody =
    bodyLines.join(" ") ||
    `${institutionLabel} için profilinizi sahiplenin; bilgilerinizi siz güncelleyin, doğru ailelere doğru bilgiyle ulaşın.`;
  const logoUrl = input.logoUrl?.trim() || resolveMailLogoUrl("https://eduatlas.com.tr");

  const bodyHtml = [
    renderMailHero({
      eyebrow: "Kurumlar için",
      title: "EduAtlas'ta Kurum Profilinizi Sahiplenin",
      body: heroBody,
      ctaLabel: CLAIM_INVITATION_CTA_LABEL,
      ctaHref,
    }),
    renderMailStatsRow(STATS),
    renderMailFeatureList({
      eyebrow: "Neden sahiplenmelisiniz?",
      heading: "Görünürlük sizin elinizde",
      items: FEATURES,
    }),
    renderMailStepsBox({
      eyebrow: "Nasıl çalışır?",
      steps: STEPS,
    }),
    `<tr>
<td align="center" style="padding:4px ${mailTheme.layout.contentPadX}px ${mailTheme.space[40]}px ${mailTheme.layout.contentPadX}px;">
${renderMailSecondaryCta(CLAIM_INVITATION_SECONDARY_CTA_LABEL, ctaHref)}
<p style="margin:14px 0 0 0;font-family:${mailTheme.font.family};font-size:${mailTheme.font.size.sm}px;color:${mailTheme.color.textBody};">Sorularınız için: <a href="mailto:info@eduatlas.com.tr" style="color:${mailTheme.color.brandRed};">info@eduatlas.com.tr</a></p>
</td>
</tr>`,
  ].join("");

  const text = [
    subject,
    "",
    "EduAtlas'ta Kurum Profilinizi Sahiplenin",
    heroBody,
    "",
    "Neden sahiplenmelisiniz?",
    ...FEATURES.map((f) => `- ${f.title}: ${f.body}`),
    "",
    "Nasıl çalışır?",
    ...STEPS.map((s, i) => `${i + 1}. ${s.label}`),
    "",
    `${CLAIM_INVITATION_SECONDARY_CTA_LABEL}: ${ctaHref}`,
  ].join("\n");

  const document = renderMailDocument({
    subject,
    preview: preheader,
    bodyHtml,
    text,
    logoUrl,
  });

  return Object.freeze({
    subject,
    html: document.html,
    text: document.text,
  });
}
