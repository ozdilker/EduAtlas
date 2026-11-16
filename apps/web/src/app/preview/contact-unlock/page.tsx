import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { InstitutionContact } from "@eduatlas/domain";
import { hasInstitutionContactUnlock } from "@/server/leads/contact-unlock-cookie";
import { PreviewContactUnlockFailureForm, PreviewContactUnlockForm } from "./preview-contact-unlock-form";
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
    <section aria-label={institution.name}>
      <h2>{institution.name}</h2>
      {contact.phone ? <p>Telefon: {contact.phone}</p> : <p>Telefon gizli</p>}
      {contact.whatsappNumber ? (
        <p>WhatsApp: {contact.whatsappNumber}</p>
      ) : (
        <p>WhatsApp gizli</p>
      )}
      {contact.email ? <p>E-posta: {contact.email}</p> : <p>E-posta gizli</p>}
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
    <main>
      <h1>Örnek iletişim kilidi</h1>
      <ContactChannels
        institution={PREVIEW_UNLOCK_INSTITUTION}
        contact={previewFixtureContact(PREVIEW_UNLOCK_INSTITUTION, unlockOpen)}
      />
      <PreviewContactUnlockForm />
      <PreviewContactUnlockFailureForm />
      <ContactChannels
        institution={PREVIEW_LOCKED_INSTITUTION}
        contact={previewFixtureContact(PREVIEW_LOCKED_INSTITUTION, lockedOpen)}
      />
    </main>
  );
}
