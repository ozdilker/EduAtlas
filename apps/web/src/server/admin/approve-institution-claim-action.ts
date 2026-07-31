"use server";

import {
  approveClaimRequest,
  isClaimValidationError,
  InstitutionNotFoundError,
  isUnauthorizedError,
} from "@eduatlas/application";
import { revalidatePath } from "next/cache";
import { getSeoSiteConfig } from "@/lib/seo-site";
import { requireAdminSession } from "@/server/auth/current-session";
import { getOwnerAccountProvisioner } from "@/server/auth/owner-account-provisioner";
import { getOwnerBindingRepository } from "@/server/auth/owner-binding";
import { getClaimRequestRepository } from "@/server/claims/claim-request-repository";
import { getInstitutionRepository } from "@/server/institutions/repository";
import { getEmailService } from "@/server/notifications/repository";

export type ApproveInstitutionClaimState = {
  ok: boolean;
  message: string;
};

/**
 * Admin: approve pending claim → verify institution, bind owner, email temp password.
 */
export async function approveInstitutionClaimAction(
  formData: FormData,
): Promise<ApproveInstitutionClaimState> {
  const claimRequestId = String(formData.get("claimRequestId") ?? "").trim();
  const institutionId = String(formData.get("institutionId") ?? "").trim();

  if (!claimRequestId || !institutionId) {
    return { ok: false, message: "Talep veya kurum bilgisi eksik." };
  }

  try {
    const session = await requireAdminSession();
    const [
      claimRequestRepository,
      institutionRepository,
      ownerBindingRepository,
      ownerAccountProvisioner,
      emailService,
    ] = await Promise.all([
      getClaimRequestRepository(),
      getInstitutionRepository(),
      Promise.resolve(getOwnerBindingRepository()),
      getOwnerAccountProvisioner(),
      getEmailService(),
    ]);

    const result = await approveClaimRequest(
      {
        claimRequestId,
        institutionId,
        reviewedBy: session.user.uid,
        siteBaseUrl: getSeoSiteConfig().siteUrl,
      },
      {
        claimRequestRepository,
        institutionRepository,
        ownerBindingRepository,
        ownerAccountProvisioner,
        emailService,
      },
    );

    revalidatePath("/admin");
    revalidatePath("/admin/acquisition");
    revalidatePath(`/institutions/${result.institution.slug}`);

    return {
      ok: true,
      message: `${result.institution.name} onaylandı. Giriş bilgileri ${result.ownerEmail} adresine gönderildi.`,
    };
  } catch (error) {
    if (isClaimValidationError(error)) {
      return { ok: false, message: error.message };
    }
    if (error instanceof InstitutionNotFoundError) {
      return { ok: false, message: "Kurum bulunamadı." };
    }
    if (isUnauthorizedError(error)) {
      return { ok: false, message: "Bu işlem için yönetici oturumu gerekli." };
    }
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Onay işlemi başarısız.",
    };
  }
}
