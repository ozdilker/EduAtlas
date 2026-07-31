import { NotificationType } from "@eduatlas/domain";

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
 * Reusable HTML + plain-text email template renderer.
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

  const bodyHtml = lines
    .map((line) => `<p style="margin:0 0 12px;line-height:1.55;">${escapeHtml(line)}</p>`)
    .join("");
  const ctaHtml =
    ctaLabel && ctaHref
      ? `<p style="margin:24px 0 0;">
          <a href="${escapeAttribute(ctaHref)}" style="display:inline-block;padding:12px 18px;background:#0f766e;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">
            ${escapeHtml(ctaLabel)}
          </a>
        </p>`
      : "";

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;color:#111827;font-family:Georgia,'Times New Roman',serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preview)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:8px;padding:28px 24px;">
          <tr>
            <td>
              <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#0f766e;font-family:system-ui,sans-serif;">EduAtlas</p>
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;font-weight:700;">${escapeHtml(subject)}</h1>
              ${bodyHtml}
              ${ctaHtml}
              <p style="margin:28px 0 0;font-size:12px;line-height:1.5;color:#6b7280;font-family:system-ui,sans-serif;">
                Bu e-posta EduAtlas üzerinden otomatik gönderilmiştir. Pazarlama içeriği değildir.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return Object.freeze({ subject, html, text });
}

export function renderNotificationEmail(input: {
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
}): RenderedEmail {
  const subject = TYPE_SUBJECTS[input.type] ?? input.title;
  return renderEmailTemplate({
    title: subject,
    preview: input.body.slice(0, 120),
    bodyLines: [input.body],
    ctaLabel: input.href ? "EduAtlas’ta görüntüle" : undefined,
    ctaHref: input.href,
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll("'", "&#39;");
}
