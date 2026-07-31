"use server";

import {
  isInstitutionNotFoundError,
  isInstitutionProfileValidationError,
  removeInstitutionBrochure,
} from "@eduatlas/application";
import { revalidatePath } from "next/cache";
import { getInstitutionRepository } from "../institutions/repository";
import { deleteOwnerInstitutionObjectByUrl } from "./owner-institution-object-storage";
import { requireOwnerContext } from "./require-owner-context";

export type RemoveOwnerInstitutionBrochureState = {
  ok: boolean;
  message: string;
};

/**
 * Deletes brochure object (best-effort) and clears brochurePdfUrl.
 */
export async function removeOwnerInstitutionBrochureAction(input: {
  brochurePdfUrl: string;
}): Promise<RemoveOwnerInstitutionBrochureState> {
  const { user, institutionId } = await requireOwnerContext();
  const brochurePdfUrl = String(input.brochurePdfUrl ?? "").trim();

  if (!brochurePdfUrl) {
    return { ok: false, message: "Silinecek broşür belirtilmedi." };
  }

  try {
    await deleteOwnerInstitutionObjectByUrl(brochurePdfUrl);

    const institutionRepository = await getInstitutionRepository();
    const saved = await removeInstitutionBrochure(
      {
        institutionId,
        brochurePdfUrl,
        updatedBy: user.uid,
      },
      { institutionRepository },
    );

    revalidatePath("/owner");
    revalidatePath("/owner/profile");
    revalidatePath("/owner/media");
    revalidatePath(`/institutions/${saved.slug}`);

    return { ok: true, message: "Broşür silindi." };
  } catch (error) {
    if (isInstitutionNotFoundError(error)) {
      return { ok: false, message: "Kurum bulunamadı." };
    }
    if (isInstitutionProfileValidationError(error)) {
      return { ok: false, message: error.message };
    }
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Broşür silinemedi.",
    };
  }
}
