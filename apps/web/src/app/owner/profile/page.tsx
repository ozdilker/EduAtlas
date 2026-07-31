import { OwnerInstitutionProfilePage } from "@eduatlas/ui";
import { redirect } from "next/navigation";
import { appendOwnerInstitutionGalleryAction } from "@/server/owner/append-owner-institution-gallery-action";
import { changeOwnerPasswordAction } from "@/server/owner/change-owner-password-action";
import { getOwnerInstitutionProfileView } from "@/server/owner/get-owner-institution-profile";
import { removeOwnerInstitutionBrochureAction } from "@/server/owner/remove-owner-institution-brochure-action";
import { removeOwnerInstitutionGalleryImageAction } from "@/server/owner/remove-owner-institution-gallery-image-action";
import { reorderOwnerInstitutionGalleryAction } from "@/server/owner/reorder-owner-institution-gallery-action";
import { requireOwnerContext } from "@/server/owner/require-owner-context";
import { updateOwnerInstitutionBrochureAction } from "@/server/owner/update-owner-institution-brochure-action";
import { updateOwnerInstitutionCoverAction } from "@/server/owner/update-owner-institution-cover-action";
import { updateOwnerInstitutionLogoAction } from "@/server/owner/update-owner-institution-logo-action";
import { updateOwnerInstitutionProfileAction } from "@/server/owner/update-owner-institution-profile-action";
import { OwnerInstitutionBrochureUpload } from "./owner-institution-brochure-upload";
import { OwnerInstitutionCoverUpload } from "./owner-institution-cover-upload";
import { OwnerInstitutionGalleryUpload } from "./owner-institution-gallery-upload";
import { OwnerInstitutionLogoUpload } from "./owner-institution-logo-upload";

export const dynamic = "force-dynamic";

/**
 * Owner institution profile management — editable published fields only.
 */
export default async function OwnerProfilePage() {
  const { institutionId } = await requireOwnerContext();
  const data = await getOwnerInstitutionProfileView({ institutionId });

  if (!data) {
    redirect("/owner/onboarding?reason=missing_institution");
  }

  return (
    <OwnerInstitutionProfilePage
      data={data}
      action={updateOwnerInstitutionProfileAction}
      changePasswordAction={changeOwnerPasswordAction}
      logoField={
        <OwnerInstitutionLogoUpload
          institutionName={data.form.institutionName}
          logoUrl={data.form.logoUrl}
          updateLogoAction={updateOwnerInstitutionLogoAction}
        />
      }
      coverField={
        <OwnerInstitutionCoverUpload
          institutionName={data.form.institutionName}
          coverImageUrl={data.form.coverImageUrl}
          updateCoverAction={updateOwnerInstitutionCoverAction}
        />
      }
      galleryField={
        <OwnerInstitutionGalleryUpload
          institutionName={data.form.institutionName}
          galleryImages={data.form.galleryImages}
          appendGalleryAction={appendOwnerInstitutionGalleryAction}
          removeGalleryImageAction={removeOwnerInstitutionGalleryImageAction}
          reorderGalleryAction={reorderOwnerInstitutionGalleryAction}
        />
      }
      brochureField={
        <OwnerInstitutionBrochureUpload
          brochurePdfUrl={data.form.brochurePdfUrl}
          updateBrochureAction={updateOwnerInstitutionBrochureAction}
          removeBrochureAction={removeOwnerInstitutionBrochureAction}
        />
      }
    />
  );
}
