"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "../components/button";
import { Input } from "../components/input";
import { cn } from "../lib/cn";

export type ClaimFormActionState = {
  ok: boolean;
  message: string;
};

export type InstitutionClaimCTAProps = {
  institutionName: string;
  institutionId: string;
  action: (prevState: ClaimFormActionState, formData: FormData) => Promise<ClaimFormActionState>;
  initialState?: ClaimFormActionState;
  /** When set, included as hidden field so submit can mark the invite token used. */
  claimInviteTokenId?: string;
  /** `panel` shows the form immediately without page-section chrome. */
  variant?: "section" | "panel";
  className?: string;
};

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" disabled={disabled || pending}>
      {pending ? "Gönderiliyor…" : "Sahiplenme talebi gönder"}
    </Button>
  );
}

/**
 * Claim CTA — "Bu kurum size mi ait?" opens a claim form; no Firestore access.
 */
export function InstitutionClaimCTA({
  institutionName,
  institutionId,
  action,
  initialState = { ok: false, message: "" },
  claimInviteTokenId,
  variant = "section",
  className,
}: InstitutionClaimCTAProps) {
  const isPanel = variant === "panel";
  const [open, setOpen] = useState(isPanel);
  const [state, formAction] = useActionState(action, initialState);

  return (
    <section
      id={isPanel ? undefined : "institution-claim"}
      className={cn(
        "ea-profile-claim",
        !isPanel && "ea-profile-section",
        isPanel && "ea-profile-claim--panel",
        className,
      )}
      aria-labelledby="institution-claim-heading"
    >
      {isPanel ? null : (
        <h2 id="institution-claim-heading" className="ea-profile-section__title">
          Kurumu sahiplen
        </h2>
      )}
      <p className="ea-profile-claim__text" id={isPanel ? "institution-claim-heading" : undefined}>
        {institutionName} sizin kurumunuz mu? Sahiplenme talebi gönderin; ekibimiz inceledikten
        sonra onay veya red bilgisini paylaşır.
      </p>

      {state.ok ? (
        <div className="ea-profile-claim__success" role="status">
          <p className="ea-profile-claim__note ea-profile-claim__note--success">{state.message}</p>
        </div>
      ) : !open ? (
        <Button type="button" variant="secondary" size="lg" onClick={() => setOpen(true)}>
          Bu kurum size mi ait?
        </Button>
      ) : (
        <form className="ea-profile-claim__form" action={formAction} noValidate>
          <input type="hidden" name="institutionId" value={institutionId} />
          {claimInviteTokenId ? (
            <input type="hidden" name="claimInviteTokenId" value={claimInviteTokenId} />
          ) : null}
          <div className="ea-profile-claim__honeypot" aria-hidden="true">
            <label htmlFor="profile-claim-website">Website</label>
            <input
              id="profile-claim-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="ea-profile-claim__field">
            <label className="ea-profile-claim__label" htmlFor="profile-claim-name">
              Adınız
            </label>
            <Input
              id="profile-claim-name"
              name="applicantName"
              autoComplete="name"
              placeholder="Ad Soyad"
              required
            />
          </div>

          <div className="ea-profile-claim__field">
            <label className="ea-profile-claim__label" htmlFor="profile-claim-role">
              Kurumdaki rolünüz
            </label>
            <select
              id="profile-claim-role"
              name="role"
              className="ea-profile-claim__select"
              defaultValue="owner"
              required
            >
              <option value="owner">Kurum sahibi</option>
              <option value="principal">Müdür / yönetici</option>
              <option value="admissions">Kayıt / danışmanlık</option>
              <option value="marketing">Pazarlama / iletişim</option>
              <option value="other">Diğer</option>
            </select>
          </div>

          <div className="ea-profile-claim__field">
            <label className="ea-profile-claim__label" htmlFor="profile-claim-phone">
              Telefon
            </label>
            <Input
              id="profile-claim-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="05xx xxx xx xx"
              required
            />
          </div>

          <div className="ea-profile-claim__field">
            <label className="ea-profile-claim__label" htmlFor="profile-claim-email">
              E-posta
            </label>
            <Input
              id="profile-claim-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="ornek@kurum.edu.tr"
              required
            />
          </div>

          <div className="ea-profile-claim__field">
            <label className="ea-profile-claim__label" htmlFor="profile-claim-message">
              Mesajınız
            </label>
            <textarea
              id="profile-claim-message"
              name="message"
              className="ea-profile-claim__textarea"
              rows={4}
              placeholder="Kurumla ilişkinizi ve sahiplenme gerekçenizi kısaca yazın"
              required
            />
          </div>

          <div className="ea-profile-claim__field">
            <label className="ea-profile-claim__label" htmlFor="profile-claim-evidence">
              Kanıt bağlantısı (isteğe bağlı)
            </label>
            <Input
              id="profile-claim-evidence"
              name="evidenceUrl"
              type="url"
              placeholder="https://…"
            />
          </div>

          <div className="ea-profile-claim__actions">
            <SubmitButton />
            {isPanel ? null : (
              <Button type="button" variant="tertiary" size="md" onClick={() => setOpen(false)}>
                Vazgeç
              </Button>
            )}
          </div>

          {state.message ? (
            <p className="ea-profile-claim__note ea-profile-claim__note--error" role="status">
              {state.message}
            </p>
          ) : (
            <p className="ea-profile-claim__note">
              Talebiniz inceleme kuyruğuna alınır. Onay arayüzü bu sprintte yoktur.
            </p>
          )}
        </form>
      )}
    </section>
  );
}
