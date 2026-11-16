"use server";

import { notFound } from "next/navigation";
import type { LeadFormActionState } from "@eduatlas/ui";
import { grantInstitutionContactUnlock } from "@/server/leads/contact-unlock-cookie";
import {
  leadSubmitFailureState,
  leadSubmitSuccessState,
} from "@/server/leads/lead-submit-result";
import {
  isPreviewContactUnlockFixtureEnabled,
  PREVIEW_UNLOCK_INSTITUTION,
  shouldGrantPreviewContactUnlock,
} from "./fixture-data";

function refuseUnlessPreview(): void {
  if (!isPreviewContactUnlockFixtureEnabled()) {
    notFound();
  }
}

/**
 * Fake success path. Grants a signed cookie for the first fixture institution only.
 * Does not persist a lead, notify anyone, or touch Firestore.
 */
export async function previewContactUnlockSuccessAction(
  _prevState: LeadFormActionState,
  formData: FormData,
): Promise<LeadFormActionState> {
  refuseUnlessPreview();
  const institutionId = String(formData.get("institutionId") ?? "");
  if (!shouldGrantPreviewContactUnlock("success", institutionId)) {
    return leadSubmitFailureState(
      "Bu önizleme formu yalnızca örnek kurum için açılabilir. İletişim bilgileri gizli kaldı.",
    );
  }

  const contactUnlocked = await grantInstitutionContactUnlock(PREVIEW_UNLOCK_INSTITUTION.id);
  return leadSubmitSuccessState(contactUnlocked);
}

/**
 * Fake failure path. Does not create an unlock cookie.
 */
export async function previewContactUnlockFailureAction(
  _prevState: LeadFormActionState,
  _formData: FormData,
): Promise<LeadFormActionState> {
  refuseUnlessPreview();
  return leadSubmitFailureState(
    "Önizleme formu başarısız oldu. İletişim bilgileri gizli kaldı.",
  );
}
