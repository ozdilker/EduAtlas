"use server";

import {
  isLeadNotFoundError,
  isLeadValidationError,
  updateLeadStatus,
} from "@eduatlas/application";
import { revalidatePath } from "next/cache";
import { getLeadRepository } from "./lead-repository";
import { requireOwnerContext } from "./require-owner-context";

/**
 * Server action: pipeline status button → updateLeadStatus application service.
 */
export async function updateOwnerLeadStatusAction(formData: FormData): Promise<void> {
  const leadId = String(formData.get("leadId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const { institutionId } = await requireOwnerContext();

  try {
    const leadRepository = await getLeadRepository();
    await updateLeadStatus({ leadId, status, institutionId }, { leadRepository });
    revalidatePath("/owner");
    revalidatePath("/owner/leads");
    revalidatePath("/owner/pipeline");
    revalidatePath(`/owner/leads/${leadId}`);
  } catch (error) {
    if (isLeadValidationError(error) || isLeadNotFoundError(error)) {
      return;
    }
    throw error;
  }
}
