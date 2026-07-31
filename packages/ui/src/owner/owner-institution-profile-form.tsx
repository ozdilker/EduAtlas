"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "../components/button";
import { Input } from "../components/input";
import { cn } from "../lib/cn";
import type {
  OwnerInstitutionProfileFormState,
  OwnerInstitutionProfileFormValues,
} from "./owner-institution-profile-content";
import { OwnerWorkingHoursFields } from "./owner-working-hours-fields";
import { OwnerPromoVideoField } from "./owner-promo-video-field";
import { OwnerAmenitiesFields } from "./owner-amenities-fields";
import { OwnerEducationProgramsFields } from "./owner-education-programs-fields";
import { OwnerFaqFields } from "./owner-faq-fields";

export type OwnerInstitutionProfileFormProps = {
  values: OwnerInstitutionProfileFormValues;
  action: (
    prevState: OwnerInstitutionProfileFormState,
    formData: FormData,
  ) => Promise<OwnerInstitutionProfileFormState>;
  /** Logo upload UI (kept outside Storage concerns in the UI package). */
  logoField?: ReactNode;
  /** Cover upload UI (single image; host app wires Storage). */
  coverField?: ReactNode;
  /** Gallery upload UI (multi image; host app wires Storage). */
  galleryField?: ReactNode;
  /** Brochure PDF upload UI (host app wires Storage). */
  brochureField?: ReactNode;
  initialState?: OwnerInstitutionProfileFormState;
  className?: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" disabled={pending}>
      {pending ? "Kaydediliyor…" : "Profili kaydet"}
    </Button>
  );
}

/**
 * Owner institution profile editor — posts to a server action; no Firestore access.
 */
export function OwnerInstitutionProfileForm({
  values,
  action,
  logoField,
  coverField,
  galleryField,
  brochureField,
  initialState = { ok: false, message: "" },
  className,
}: OwnerInstitutionProfileFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form
      key={values.updatedAtLabel}
      className={cn("ea-owner-profile-form", className)}
      action={formAction}
      noValidate
    >
      <input type="hidden" name="institutionId" value={values.institutionId} />

      {state.message ? (
        <p
          className={cn(
            "ea-owner-profile-form__status",
            state.ok
              ? "ea-owner-profile-form__status--success"
              : "ea-owner-profile-form__status--error",
          )}
          role="status"
        >
          {state.message}
        </p>
      ) : null}

      <div className="ea-owner-profile-form__columns">
        <div className="ea-owner-profile-form__column">
          <section
            id="owner-profile-logo"
            className="ea-owner-profile-form__section"
            aria-labelledby="owner-profile-logo-heading"
          >
            <h2 id="owner-profile-logo-heading" className="ea-owner-profile-form__section-title">
              Logo
            </h2>
            {logoField ?? (
              <p className="ea-owner-profile-form__placeholder" role="note">
                Logo yükleme yakında eklenecek. Bu sprintte medya yükleme ve AI düzenleme yoktur.
              </p>
            )}
          </section>

          <section
            id="owner-profile-cover"
            className="ea-owner-profile-form__section"
            aria-labelledby="owner-profile-cover-heading"
          >
            <h2 id="owner-profile-cover-heading" className="ea-owner-profile-form__section-title">
              Kapak fotoğrafı
            </h2>
            {coverField ?? (
              <p className="ea-owner-profile-form__placeholder" role="note">
                Kapak fotoğrafı yükleme yakında eklenecek.
              </p>
            )}
          </section>

          <section
            id="owner-profile-gallery"
            className="ea-owner-profile-form__section"
            aria-labelledby="owner-profile-gallery-heading"
          >
            <h2 id="owner-profile-gallery-heading" className="ea-owner-profile-form__section-title">
              Galeri
            </h2>
            {galleryField ?? (
              <p className="ea-owner-profile-form__placeholder" role="note">
                Galeri yükleme yakında eklenecek. Bu sprintte medya yükleme, AI düzenleme ve
                moderasyon yoktur.
              </p>
            )}
          </section>

          <section
            id="owner-profile-brochure"
            className="ea-owner-profile-form__section"
            aria-labelledby="owner-profile-brochure-heading"
          >
            <h2
              id="owner-profile-brochure-heading"
              className="ea-owner-profile-form__section-title"
            >
              PDF / Broşür
            </h2>
            {brochureField ?? (
              <p className="ea-owner-profile-form__placeholder" role="note">
                Broşür PDF yükleme yakında eklenecek.
              </p>
            )}
          </section>

          <section className="ea-owner-profile-form__section" aria-labelledby="owner-profile-basic">
            <h2 id="owner-profile-basic" className="ea-owner-profile-form__section-title">
              Temel bilgiler
            </h2>
            <p className="ea-owner-profile-form__section-text">
              Kurum adı ve adres bu sprintte değiştirilemez. Yayınlanan alanlar doğrudan
              güncellenir; onay akışı yoktur.
            </p>
            <div className="ea-owner-profile-form__field">
              <label className="ea-owner-profile-form__label" htmlFor="owner-profile-name">
                Kurum adı
              </label>
              <Input
                id="owner-profile-name"
                value={values.institutionName}
                readOnly
                aria-readonly="true"
              />
            </div>
          </section>

          <section
            id="owner-profile-contact"
            className="ea-owner-profile-form__section"
            aria-labelledby="owner-profile-contact-heading"
          >
            <h2 id="owner-profile-contact-heading" className="ea-owner-profile-form__section-title">
              İletişim bilgileri
            </h2>
            <div className="ea-owner-profile-form__grid">
              <div className="ea-owner-profile-form__field">
                <label className="ea-owner-profile-form__label" htmlFor="owner-profile-phone">
                  Telefon
                </label>
                <Input
                  id="owner-profile-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  defaultValue={values.phone}
                  placeholder="+90 216 …"
                />
              </div>
              <div className="ea-owner-profile-form__field">
                <label className="ea-owner-profile-form__label" htmlFor="owner-profile-whatsapp">
                  WhatsApp
                </label>
                <Input
                  id="owner-profile-whatsapp"
                  name="whatsappNumber"
                  type="tel"
                  autoComplete="tel"
                  defaultValue={values.whatsappNumber}
                  placeholder="+90 5xx …"
                />
              </div>
              <div className="ea-owner-profile-form__field">
                <label className="ea-owner-profile-form__label" htmlFor="owner-profile-email">
                  E-posta
                </label>
                <Input
                  id="owner-profile-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  defaultValue={values.email}
                  placeholder="info@ornek.edu.tr"
                />
              </div>
              <div className="ea-owner-profile-form__field ea-owner-profile-form__field--full">
                <label className="ea-owner-profile-form__label" htmlFor="owner-profile-address">
                  Adres
                </label>
                <textarea
                  id="owner-profile-address"
                  name="address"
                  className="ea-owner-profile-form__textarea"
                  rows={3}
                  maxLength={500}
                  required
                  defaultValue={values.address}
                  placeholder="Mahalle, cadde, no…"
                />
              </div>
              <div className="ea-owner-profile-form__field ea-owner-profile-form__field--full">
                <label
                  className="ea-owner-profile-form__label"
                  htmlFor="owner-profile-google-maps"
                >
                  Google Maps linki
                </label>
                <Input
                  id="owner-profile-google-maps"
                  name="googleMapsUrl"
                  type="url"
                  inputMode="url"
                  autoComplete="url"
                  defaultValue={values.googleMapsUrl}
                  placeholder="https://maps.google.com/…"
                />
              </div>
            </div>
          </section>

          <section
            id="owner-profile-description"
            className="ea-owner-profile-form__section"
            aria-labelledby="owner-profile-description-heading"
          >
            <h2
              id="owner-profile-description-heading"
              className="ea-owner-profile-form__section-title"
            >
              Açıklama
            </h2>
            <div className="ea-owner-profile-form__field">
              <label className="ea-owner-profile-form__label" htmlFor="owner-profile-short">
                Kısa açıklama
              </label>
              <textarea
                id="owner-profile-short"
                name="shortDescription"
                className="ea-owner-profile-form__textarea"
                rows={3}
                maxLength={500}
                required
                defaultValue={values.shortDescription}
              />
            </div>
            <div className="ea-owner-profile-form__field">
              <label className="ea-owner-profile-form__label" htmlFor="owner-profile-long">
                Uzun açıklama
              </label>
              <textarea
                id="owner-profile-long"
                name="longDescription"
                className="ea-owner-profile-form__textarea"
                rows={6}
                maxLength={5000}
                defaultValue={values.longDescription}
              />
            </div>
          </section>
        </div>

        <div className="ea-owner-profile-form__column">
          <section
            id="owner-profile-social"
            className="ea-owner-profile-form__section"
            aria-labelledby="owner-profile-social-heading"
          >
            <h2 id="owner-profile-social-heading" className="ea-owner-profile-form__section-title">
              Sosyal medya hesapları
            </h2>
            <p className="ea-owner-profile-form__section-text">
              Yalnızca geçerli http(s) URL’leri kabul edilir.
            </p>
            <div className="ea-owner-profile-form__grid">
              {(
                [
                  ["websiteUrl", "Website", values.websiteUrl],
                  ["instagramUrl", "Instagram", values.instagramUrl],
                  ["facebookUrl", "Facebook", values.facebookUrl],
                  ["twitterUrl", "X", values.twitterUrl],
                  ["linkedinUrl", "LinkedIn", values.linkedinUrl],
                  ["youtubeUrl", "YouTube", values.youtubeUrl],
                ] as const
              ).map(([name, label, defaultValue]) => (
                <div key={name} className="ea-owner-profile-form__field">
                  <label className="ea-owner-profile-form__label" htmlFor={`owner-profile-${name}`}>
                    {label}
                  </label>
                  <Input
                    id={`owner-profile-${name}`}
                    name={name}
                    type="url"
                    inputMode="url"
                    autoComplete="url"
                    defaultValue={defaultValue}
                    placeholder="https://"
                  />
                </div>
              ))}
            </div>
          </section>

          <section
            id="owner-profile-video"
            className="ea-owner-profile-form__section"
            aria-labelledby="owner-profile-video-heading"
          >
            <h2 id="owner-profile-video-heading" className="ea-owner-profile-form__section-title">
              Tanıtım videosu
            </h2>
            <OwnerPromoVideoField defaultValue={values.promoVideoUrl} />
          </section>

          <section
            id="owner-profile-amenities"
            className="ea-owner-profile-form__section"
            aria-labelledby="owner-profile-amenities-heading"
          >
            <h2
              id="owner-profile-amenities-heading"
              className="ea-owner-profile-form__section-title"
            >
              Kurum özellikleri
            </h2>
            <OwnerAmenitiesFields options={values.amenityOptions} />
          </section>

          <section
            id="owner-profile-hours"
            className="ea-owner-profile-form__section"
            aria-labelledby="owner-profile-hours-heading"
          >
            <h2 id="owner-profile-hours-heading" className="ea-owner-profile-form__section-title">
              Çalışma saatleri
            </h2>
            <OwnerWorkingHoursFields value={values.workingHours} />
          </section>

          <section
            id="owner-profile-programs"
            className="ea-owner-profile-form__section"
            aria-labelledby="owner-profile-programs-heading"
          >
            <h2 id="owner-profile-programs-heading" className="ea-owner-profile-form__section-title">
              Eğitim programları
            </h2>
            <OwnerEducationProgramsFields options={values.educationProgramOptions} />
          </section>

          <section
            id="owner-profile-faqs"
            className="ea-owner-profile-form__section"
            aria-labelledby="owner-profile-faqs-heading"
          >
            <h2 id="owner-profile-faqs-heading" className="ea-owner-profile-form__section-title">
              Sık sorulan sorular
            </h2>
            <OwnerFaqFields value={values.faqs} />
          </section>
        </div>
      </div>

      <div className="ea-owner-profile-form__footer">
        <p className="ea-owner-profile-form__meta">
          Son güncelleme: {values.updatedAtLabel}
          {values.updatedByLabel ? ` · ${values.updatedByLabel}` : ""}
        </p>
        <div className="ea-owner-profile-form__actions">
          <a href={values.publicProfileHref} className="ea-owner-portal__public-link">
            Genel profili gör
          </a>
          <SubmitButton />
        </div>
      </div>
    </form>
  );
}
