"use server";

import { notFound } from "next/navigation";
import type { LeadFormActionState } from "@eduatlas/ui";
import { leadSubmitFailureState } from "@/server/leads/lead-submit-result";
import { isPreviewContactUnlockFixtureEnabled } from "./fixture-data";

function refuseUnlessPreview(): void {
  if (!isPreviewContactUnlockFixtureEnabled()) {
    notFound();
  }
}

/**
 * Fake failure path. Does not create an unlock cookie.
 * Does not persist a lead, notify anyone, or touch Firestore.
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
