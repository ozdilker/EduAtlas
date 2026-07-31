import type { LeadNotificationRecipient } from "@eduatlas/application";
import { DEV_AUTH_SEED_USERS } from "../auth/authentication-service";
import { getOwnerBindingRepository } from "../auth/owner-binding";
import {
  getOwnerDemoInstitutionId,
  isOwnerDemoInstitutionFallbackEnabled,
} from "../owner/owner-demo-context";

/**
 * Resolves which authenticated owner should receive Lead Received events.
 * Uses approved binding first; demo seed owner only when demo fallback is enabled.
 */
export async function resolveLeadNotificationRecipient(
  institutionId: string,
): Promise<LeadNotificationRecipient | null> {
  const binding = await getOwnerBindingRepository().findApprovedByInstitutionId(institutionId);
  if (binding) {
    return { userId: binding.userId };
  }

  if (
    isOwnerDemoInstitutionFallbackEnabled() &&
    institutionId.trim() === getOwnerDemoInstitutionId()
  ) {
    const demoOwner = DEV_AUTH_SEED_USERS[0];
    return {
      userId: demoOwner.uid,
      email: demoOwner.email,
    };
  }

  return null;
}
