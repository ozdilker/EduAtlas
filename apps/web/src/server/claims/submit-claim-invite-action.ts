import {
  ClaimInstitutionNotFoundError,
  isClaimRateLimitedError,
  isClaimSpamRejectedError,
  isClaimValidationError,
  submitClaimRequest,
} from "@eduatlas/application";
import type { ClaimFormActionState } from "@eduatlas/ui";
import { getInstitutionRepository } from "@/server/institutions/repository";
import { getNotificationService } from "@/server/notifications/repository";
import { getClaimInviteTokenRepository } from "./claim-invite-token-repository";
import { getClaimRequestRepository } from "./claim-request-repository";

/**
 * Server action: /claim page (token prefilled) → submitClaimRequest + mark token used.
 */
export async function submitClaimInviteAction(
  _prevState: ClaimFormActionState,
  formData: FormData,
): Promise<ClaimFormActionState> {
  const institutionId = String(formData.get("institutionId") ?? "").trim();
  const claimInviteTokenId = String(formData.get("claimInviteTokenId") ?? "").trim();
  const applicantName = String(formData.get("applicantName") ?? "");
  const role = String(formData.get("role") ?? "");
  const phone = String(formData.get("phone") ?? "");
  const email = String(formData.get("email") ?? "");
  const message = String(formData.get("message") ?? "");
  const evidenceUrl = String(formData.get("evidenceUrl") ?? "").trim();
  const honeypot = String(formData.get("website") ?? "");

  try {
    const [
      institutionRepository,
      claimRequestRepository,
      notificationService,
      claimInviteTokenRepository,
    ] = await Promise.all([
      getInstitutionRepository(),
      getClaimRequestRepository(),
      getNotificationService(),
      getClaimInviteTokenRepository(),
    ]);

    await submitClaimRequest(
      {
        institutionId,
        applicantName,
        role,
        phone,
        email,
        message,
        ...(evidenceUrl ? { evidenceUrl } : {}),
        honeypot,
        ...(claimInviteTokenId ? { claimInviteTokenId } : {}),
      },
      {
        institutionRepository,
        claimRequestRepository,
        notificationService,
        claimInviteTokenRepository,
      },
    );

    return {
      ok: true,
      message:
        "Sahiplenme talebiniz alındı ve inceleme kuyruğuna eklendi. Onay süreci tamamlandığında bilgilendirileceksiniz.",
    };
  } catch (error) {
    if (isClaimSpamRejectedError(error)) {
      return { ok: false, message: "Gönderim reddedildi." };
    }
    if (isClaimRateLimitedError(error)) {
      return { ok: false, message: "Çok fazla deneme yaptınız. Lütfen sonra tekrar deneyin." };
    }
    if (isClaimValidationError(error)) {
      return { ok: false, message: error.message };
    }
    if (error instanceof ClaimInstitutionNotFoundError) {
      return { ok: false, message: "Kurum bulunamadı." };
    }

    return {
      ok: false,
      message: "Talebiniz kaydedilemedi. Lütfen daha sonra tekrar deneyin.",
    };
  }
}
