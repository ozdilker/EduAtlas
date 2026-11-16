import { createInstitutionContact, type InstitutionContact } from "@eduatlas/domain";
import type { InstitutionPrivateContact } from "./institution-private-contact";

/**
 * Private store wins when a document exists.
 * Legacy institution fields are used only when that document is absent.
 * Callers must still withhold the result from public HTML unless unlock is valid.
 */
export function resolveInstitutionContactSource(
  legacy: InstitutionContact,
  privateContact: InstitutionPrivateContact | null,
): InstitutionContact {
  if (!privateContact) {
    return legacy;
  }
  return createInstitutionContact({
    phone: privateContact.phone,
    email: privateContact.email,
    whatsappNumber: privateContact.whatsappNumber,
  });
}

/** Public profile channels. Locked visitors receive no phone, WhatsApp, or email. */
export function publicContactChannels(input: {
  readonly unlocked: boolean;
  readonly contact: InstitutionContact;
}): InstitutionContact {
  if (!input.unlocked) {
    return createInstitutionContact({});
  }
  return input.contact;
}
