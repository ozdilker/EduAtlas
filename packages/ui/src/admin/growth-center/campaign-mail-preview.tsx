"use client";

import { useEffect, useState } from "react";
import { EmailPreviewFrame } from "./email-preview-frame";

export type CampaignMailPreviewProps = {
  templateId: string;
  subject: string;
  preheader: string;
  description?: string;
  institutionName: string;
  /** Server-rendered fallback while live preview loads. */
  initialHtml?: string;
  initialSubject?: string;
  className?: string;
  title?: string;
};

function personalize(text: string, institutionName: string): string {
  const name = institutionName.trim() || "Kurumunuz";
  return text.replaceAll("{{institutionName}}", name);
}

/**
 * Inbox chrome + live HTML preview from draft subject/preheader/body.
 * HTML uses the claim-invitation template shell with campaign copy in hero slots.
 */
export function CampaignMailPreview({
  templateId,
  subject,
  preheader,
  description = "",
  institutionName,
  initialHtml = "",
  initialSubject = "",
  className,
  title = "Kampanya e-posta önizlemesi",
}: CampaignMailPreviewProps) {
  const [html, setHtml] = useState(initialHtml);
  const [resolvedSubject, setResolvedSubject] = useState(
    initialSubject || personalize(subject, institutionName),
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const displaySubject = personalize(subject, institutionName);
  const displayPreheader = personalize(preheader, institutionName);

  useEffect(() => {
    setHtml(initialHtml);
    if (initialSubject) setResolvedSubject(initialSubject);
  }, [initialHtml, initialSubject]);

  useEffect(() => {
    const trimmedSubject = subject.trim();
    const trimmedPreheader = preheader.trim();
    const trimmedTemplateId = templateId.trim();
    if (!trimmedSubject || !trimmedPreheader || !trimmedTemplateId) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setBusy(true);
      setError(null);
      try {
        const response = await fetch("/api/admin/outreach-mail-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateId: trimmedTemplateId,
            subject: trimmedSubject,
            preheader: trimmedPreheader,
            description,
            institutionName,
          }),
          signal: controller.signal,
        });
        const payload = (await response.json()) as {
          ok?: boolean;
          message?: string;
          subject?: string;
          html?: string;
        };
        if (!response.ok || !payload.ok || !payload.html) {
          setError(payload.message || "Önizleme güncellenemedi.");
          return;
        }
        setHtml(payload.html);
        setResolvedSubject(payload.subject || displaySubject);
      } catch {
        if (controller.signal.aborted) return;
        setError("Önizleme isteği başarısız.");
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    }, 280);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [subject, preheader, description, templateId, institutionName, displaySubject]);

  return (
    <div className="ea-mail-preview">
      <div className="ea-mail-preview__inbox" aria-label="Gelen kutusu önizlemesi">
        <p className="ea-mail-preview__row">
          <span className="ea-mail-preview__label">Konu</span>
          <strong>{displaySubject || resolvedSubject || "—"}</strong>
        </p>
        <p className="ea-mail-preview__row">
          <span className="ea-mail-preview__label">Preheader</span>
          <span>{displayPreheader || "—"}</span>
        </p>
        {busy ? <p className="ea-admin-muted ea-mail-preview__status">Güncelleniyor…</p> : null}
        {error ? <p className="ea-admin-muted ea-mail-preview__status">{error}</p> : null}
      </div>
      {html ? (
        <EmailPreviewFrame html={html} title={title} className={className} />
      ) : (
        <p className="ea-admin-muted">
          Konu ve preheader doldurulunca şablon önizlemesi burada görünür.
        </p>
      )}
    </div>
  );
}
