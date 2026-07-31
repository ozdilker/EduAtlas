"use client";

import { useActionState, useState, type FormEvent } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "../components/button";
import { Input } from "../components/input";
import { cn } from "../lib/cn";

export type LeadFormActionState = {
  ok: boolean;
  message: string;
};

export type InstitutionLeadCTAProps = {
  institutionName: string;
  institutionId: string;
  action: (prevState: LeadFormActionState, formData: FormData) => Promise<LeadFormActionState>;
  initialState?: LeadFormActionState;
  /** `panel` omits page-section chrome for modal use. */
  variant?: "section" | "panel";
  className?: string;
};

const REQUIRED_FIELD_LABELS = {
  parentName: "Adınız",
  phone: "Telefon",
  message: "Mesajınız",
  consentAccepted: "KVKK onayı",
} as const;

function getMissingRequiredFields(form: HTMLFormElement): string[] {
  const data = new FormData(form);
  const missing: string[] = [];

  if (!String(data.get("parentName") ?? "").trim()) {
    missing.push(REQUIRED_FIELD_LABELS.parentName);
  }
  if (!String(data.get("phone") ?? "").trim()) {
    missing.push(REQUIRED_FIELD_LABELS.phone);
  }
  if (!String(data.get("message") ?? "").trim()) {
    missing.push(REQUIRED_FIELD_LABELS.message);
  }
  if (data.get("consentAccepted") !== "true") {
    missing.push(REQUIRED_FIELD_LABELS.consentAccepted);
  }

  return missing;
}

function formatMissingFieldsWarning(missing: string[]): string {
  if (missing.length === 1) {
    return `Eksik bilgi var. Lütfen şu alanı doldurun: ${missing[0]}.`;
  }
  return `Eksik bilgiler var. Lütfen şu alanları doldurun: ${missing.join(", ")}.`;
}

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" disabled={disabled || pending}>
      {pending ? "Gönderiliyor…" : "Bilgi Talebi Gönder"}
    </Button>
  );
}

/**
 * Lead CTA block — posts to a server action; no Firestore access.
 */
export function InstitutionLeadCTA({
  institutionName,
  institutionId,
  action,
  initialState = { ok: false, message: "" },
  variant = "section",
  className,
}: InstitutionLeadCTAProps) {
  const [state, formAction] = useActionState(action, initialState);
  const [clientMessage, setClientMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const missing = getMissingRequiredFields(event.currentTarget);
    if (missing.length > 0) {
      event.preventDefault();
      setClientMessage(formatMissingFieldsWarning(missing));
      return;
    }
    setClientMessage("");
  }

  const errorMessage = clientMessage || (!state.ok ? state.message : "");
  const isPanel = variant === "panel";

  return (
    <section
      id={isPanel ? undefined : "institution-lead"}
      className={cn(
        "ea-profile-lead",
        !isPanel && "ea-profile-section",
        isPanel && "ea-profile-lead--panel",
        className,
      )}
      aria-labelledby="institution-lead-heading"
    >
      {isPanel ? null : (
        <h2 id="institution-lead-heading" className="ea-profile-section__title">
          Bilgi al
        </h2>
      )}
      <p className="ea-profile-lead__text" id={isPanel ? "institution-lead-heading" : undefined}>
        {institutionName} hakkında bilgi talep edin. Ekibimiz veya kurum sizinle iletişime
        geçebilir.
      </p>

      {state.ok ? (
        <div className="ea-profile-lead__success" role="status">
          <p className="ea-profile-lead__note ea-profile-lead__note--success">{state.message}</p>
        </div>
      ) : (
        <form
          className="ea-profile-lead__form"
          action={formAction}
          onSubmit={handleSubmit}
          noValidate
        >
          <input type="hidden" name="institutionId" value={institutionId} />

          <div className="ea-profile-lead__honeypot" aria-hidden="true">
            <label htmlFor="profile-lead-website">Website</label>
            <input
              id="profile-lead-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="ea-profile-lead__field">
            <label className="ea-profile-lead__label" htmlFor="profile-lead-name">
              Adınız
            </label>
            <Input
              id="profile-lead-name"
              name="parentName"
              autoComplete="name"
              placeholder="Ad Soyad"
              required
            />
          </div>
          <div className="ea-profile-lead__field">
            <label className="ea-profile-lead__label" htmlFor="profile-lead-phone">
              Telefon
            </label>
            <Input
              id="profile-lead-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="05xx xxx xx xx"
              required
            />
          </div>
          <div className="ea-profile-lead__field">
            <label className="ea-profile-lead__label" htmlFor="profile-lead-message">
              Mesajınız
            </label>
            <textarea
              id="profile-lead-message"
              name="message"
              className="ea-profile-lead__textarea"
              rows={4}
              placeholder="Kısaca ne öğrenmek istediğinizi yazın"
              required
            />
          </div>
          <div className="ea-profile-lead__field">
            <label className="ea-profile-lead__consent" htmlFor="profile-lead-consent">
              <input
                id="profile-lead-consent"
                name="consentAccepted"
                type="checkbox"
                value="true"
                required
              />
              <span>
                Bilgilerimin EduAtlas ve ilgili kurum ile paylaşılmasını KVKK kapsamında kabul
                ediyorum.
              </span>
            </label>
          </div>
          <SubmitButton />
          {errorMessage ? (
            <p className="ea-profile-lead__note ea-profile-lead__note--error" role="alert">
              {errorMessage}
            </p>
          ) : (
            <p className="ea-profile-lead__note">Ortalama yanıt süresi kuruma göre değişir.</p>
          )}
        </form>
      )}
    </section>
  );
}
