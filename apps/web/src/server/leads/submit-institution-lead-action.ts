"use server";

import {
  isLeadRateLimitedError,
  isLeadSpamRejectedError,
  isLeadValidationError,
  LeadInstitutionNotFoundError,
  submitLead,
} from "@eduatlas/application";
import type { LeadFormActionState } from "@eduatlas/ui";
import { getInstitutionRepository } from "@/server/institutions/repository";
import { getNotificationService } from "@/server/notifications/repository";
import { resolveLeadNotificationRecipient } from "@/server/notifications/resolve-lead-recipient";
import { sendClaimInviteEmailAfterLead } from "@/server/notifications/send-claim-invite-email";
import { getLeadRepository } from "@/server/owner/lead-repository";
import { grantInstitutionContactUnlock } from "./contact-unlock-cookie";
import { leadSubmitFailureState, leadSubmitSuccessState } from "./lead-submit-result";

/**
 * Server action: institution page lead form → application service → repository.
 * Contact unlock cookie is set only after a successful lead persist.
 */
export async function submitInstitutionLeadAction(
  _prevState: LeadFormActionState,
  formData: FormData,
): Promise<LeadFormActionState> {
  const institutionId = String(formData.get("institutionId") ?? "").trim();
  const parentName = String(formData.get("parentName") ?? "");
  const phone = String(formData.get("phone") ?? "");
  const message = String(formData.get("message") ?? "");
  const honeypot = String(formData.get("website") ?? "");
  const consentAccepted = formData.get("consentAccepted") === "true";

  try {
    const [institutionRepository, leadRepository, notificationService] = await Promise.all([
      getInstitutionRepository(),
      getLeadRepository(),
      getNotificationService(),
    ]);

    await submitLead(
      {
        institutionId,
        parentName,
        phone,
        message,
        consentAccepted,
        honeypot,
      },
      {
        institutionRepository,
        leadRepository,
        notificationService,
        resolveLeadRecipient: resolveLeadNotificationRecipient,
        sendClaimInviteEmail: sendClaimInviteEmailAfterLead,
      },
    );

    const contactUnlocked = await grantInstitutionContactUnlock(institutionId);
    return leadSubmitSuccessState(contactUnlocked);
  } catch (error) {
    if (isLeadSpamRejectedError(error)) {
      return leadSubmitFailureState("Gönderim reddedildi.");
    }
    if (isLeadRateLimitedError(error)) {
      return leadSubmitFailureState("Çok fazla deneme yaptınız. Lütfen sonra tekrar deneyin.");
    }
    if (isLeadValidationError(error)) {
      return leadSubmitFailureState(error.message);
    }
    if (error instanceof LeadInstitutionNotFoundError) {
      return leadSubmitFailureState("Kurum bulunamadı.");
    }

    return leadSubmitFailureState("Talebiniz kaydedilemedi. Lütfen daha sonra tekrar deneyin.");
  }
}
