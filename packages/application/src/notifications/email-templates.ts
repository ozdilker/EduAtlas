import { NotificationType } from "@eduatlas/domain";
import {
  escapeHtml,
  mailTheme,
  renderMailDocument,
  renderMailPrimaryCta,
  renderMailTitle,
} from "../mail-design";

export type EmailTemplateModel = {
  title: string;
  preview: string;
  bodyLines: readonly string[];
  ctaLabel?: string;
  ctaHref?: string;
};

export type RenderedEmail = Readonly<{
  readonly subject: string;
  readonly html: string;
  readonly text: string;
}>;

const TYPE_SUBJECTS: Record<NotificationType, string> = {
  [NotificationType.LeadReceived]: "EduAtlas — Yeni bilgi talebi",
  [NotificationType.ClaimSubmitted]: "EduAtlas — Sahiplenme talebiniz alındı",
  [NotificationType.ClaimApproved]: "EduAtlas — Sahiplenme onaylandı",
  [NotificationType.ProfileUpdated]: "EduAtlas — Profil güncellendi",
  [NotificationType.PasswordReset]: "EduAtlas — Şifre sıfırlama",
  [NotificationType.Welcome]: "EduAtlas — Hoş geldiniz",
  [NotificationType.EmailVerification]: "EduAtlas — E-posta doğrulama",
};

/**
 * Reusable HTML + plain-text email template renderer (EMDS layout).
 * Responsive table layout, semantic structure, plain-text fallback.
 */
export function renderEmailTemplate(model: EmailTemplateModel): RenderedEmail {
  const subject = model.title.trim();
  const preview = model.preview.trim();
  const lines = model.bodyLines.map((line) => line.trim()).filter(Boolean);
  const ctaLabel = model.ctaLabel?.trim();
  const ctaHref = model.ctaHref?.trim();

  const textParts = [subject, "", ...lines];
  if (ctaLabel && ctaHref) {
    textParts.push("", `${ctaLabel}: ${ctaHref}`);
  }
  const text = textParts.join("\n");

  const bodyHtml = [
    renderMailTitle(subject),
    ...lines.map(
      (line) =>
        `<p style="margin:0 0 ${mailTheme.space[12]}px;font-family:${mailTheme.font.family};font-size:${mailTheme.font.size.md}px;line-height:1.55;color:${mailTheme.color.text};">${escapeHtml(line)}</p>`,
    ),
    ctaLabel && ctaHref ? renderMailPrimaryCta(ctaLabel, ctaHref) : "",
  ].join("");

  const document = renderMailDocument({
    subject,
    preview,
    bodyHtml,
    text,
  });

  return Object.freeze({
    subject,
    html: document.html,
    text: document.text,
  });
}

export function renderNotificationEmail(input: {
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  subject?: string;
  ctaLabel?: string;
}): RenderedEmail {
  const subject = input.subject?.trim() || TYPE_SUBJECTS[input.type] || input.title;
  return renderEmailTemplate({
    title: subject,
    preview: input.body.slice(0, 120),
    bodyLines: [input.body],
    ctaLabel: input.href
      ? input.ctaLabel?.trim() || "EduAtlas’ta görüntüle"
      : undefined,
    ctaHref: input.href,
  });
}
