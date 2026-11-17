import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { InstitutionContact } from "@eduatlas/domain";
import { Button, Input } from "@eduatlas/ui";
import { hasInstitutionContactUnlock } from "@/server/leads/contact-unlock-cookie";
import { PreviewContactUnlockFailureForm } from "./preview-contact-unlock-form";
import { previewFixtureContact } from "./fixture-channels";
import {
  isPreviewContactUnlockFixtureEnabled,
  PREVIEW_LOCKED_INSTITUTION,
  PREVIEW_UNLOCK_INSTITUTION,
  type PreviewFixtureInstitution,
} from "./fixture-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "İletişim kilidi önizlemesi",
  robots: { index: false, follow: false },
};

function ContactChannels({
  institution,
  contact,
}: {
  institution: PreviewFixtureInstitution;
  contact: InstitutionContact;
}) {
  return (
    <section className="ea-profile-section" aria-label={institution.name}>
      <h2 className="ea-profile-section__title">{institution.name}</h2>
      <div className="ea-profile-lead__field">
        <span className="ea-profile-lead__label">Telefon</span>
        <p className="ea-profile-lead__text">{contact.phone ?? "Telefon gizli"}</p>
      </div>
      <div className="ea-profile-lead__field">
        <span className="ea-profile-lead__label">WhatsApp</span>
        <p className="ea-profile-lead__text">{contact.whatsappNumber ?? "WhatsApp gizli"}</p>
      </div>
      <div className="ea-profile-lead__field">
        <span className="ea-profile-lead__label">E-posta</span>
        <p className="ea-profile-lead__text">{contact.email ?? "E-posta gizli"}</p>
      </div>
    </section>
  );
}

export default async function PreviewContactUnlockPage() {
  if (!isPreviewContactUnlockFixtureEnabled()) {
    notFound();
  }

  const [unlockOpen, lockedOpen] = await Promise.all([
    hasInstitutionContactUnlock(PREVIEW_UNLOCK_INSTITUTION.id),
    hasInstitutionContactUnlock(PREVIEW_LOCKED_INSTITUTION.id),
  ]);

  return (
    <main className="ea-profile-page">
      <div className="ea-container ea-container--md">
        <div className="ea-profile-page__main">
          <h1 className="ea-profile-section__title">Örnek iletişim kilidi</h1>
          <ContactChannels
            institution={PREVIEW_UNLOCK_INSTITUTION}
            contact={previewFixtureContact(PREVIEW_UNLOCK_INSTITUTION, unlockOpen)}
          />
          <section className="ea-profile-lead" aria-labelledby="preview-grant-heading">
            {unlockOpen ? (
              <div className="ea-profile-lead__success" role="status">
                <p className="ea-profile-lead__note ea-profile-lead__note--success">
                  Talebiniz alındı. Bu kurumun iletişim bilgileri görüntülenebilir.
                </p>
              </div>
            ) : (
              <form className="ea-profile-lead__form" method="post" action="/preview/contact-unlock/grant">
                <input type="hidden" name="institutionId" value={PREVIEW_UNLOCK_INSTITUTION.id} />
                <p className="ea-profile-lead__text" id="preview-grant-heading">
                  {PREVIEW_UNLOCK_INSTITUTION.name} hakkında bilgi talep edin. Bu önizleme
                  kayıt oluşturmaz.
                </p>
                <div className="ea-profile-lead__field">
                  <label className="ea-profile-lead__label" htmlFor="preview-grant-name">
                    Adınız
                  </label>
                  <Input id="preview-grant-name" name="parentName" autoComplete="name" required />
                </div>
                <div className="ea-profile-lead__field">
                  <label className="ea-profile-lead__label" htmlFor="preview-grant-phone">
                    Telefon
                  </label>
                  <Input id="preview-grant-phone" name="phone" type="tel" autoComplete="tel" required />
                </div>
                <div className="ea-profile-lead__field">
                  <label className="ea-profile-lead__label" htmlFor="preview-grant-message">
                    Mesajınız
                  </label>
                  <textarea
                    id="preview-grant-message"
                    name="message"
                    className="ea-profile-lead__textarea"
                    rows={4}
                    required
                  />
                </div>
                <div className="ea-profile-lead__field">
                  <label className="ea-profile-lead__consent" htmlFor="preview-grant-consent">
                    <input id="preview-grant-consent" name="consentAccepted" type="checkbox" value="true" required />
                    <span>Bilgilerimin bu önizleme akışında kullanılmasını kabul ediyorum.</span>
                  </label>
                </div>
                <Button type="submit" variant="primary" size="lg">
                  Bilgi Talebi Gönder
                </Button>
              </form>
            )}
          </section>
          <PreviewContactUnlockFailureForm />
          <ContactChannels
            institution={PREVIEW_LOCKED_INSTITUTION}
            contact={previewFixtureContact(PREVIEW_LOCKED_INSTITUTION, lockedOpen)}
          />
        </div>
      </div>
    </main>
  );
}
