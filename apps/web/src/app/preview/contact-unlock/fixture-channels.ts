import { publicContactChannels } from "@eduatlas/application";
import { createInstitutionContact, type InstitutionContact } from "@eduatlas/domain";
import {
  PREVIEW_LOCKED_INSTITUTION,
  PREVIEW_UNLOCK_INSTITUTION,
  type PreviewFixtureInstitution,
} from "./fixture-data";

export function previewFixtureContact(
  institution: PreviewFixtureInstitution,
  unlocked: boolean,
): InstitutionContact {
  return publicContactChannels({
    unlocked,
    contact: createInstitutionContact({
      phone: institution.phone,
      email: institution.email,
      whatsappNumber: institution.whatsapp,
    }),
  });
}

export function previewFixtureInstitutions(): readonly PreviewFixtureInstitution[] {
  return [PREVIEW_UNLOCK_INSTITUTION, PREVIEW_LOCKED_INSTITUTION];
}
