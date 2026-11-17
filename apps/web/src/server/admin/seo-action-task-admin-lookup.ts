import { appRoleFromClaims, canAccessAdminPortal } from "@eduatlas/domain";
import { getAdminAuth } from "@eduatlas/firebase/server";

/**
 * True when the Firebase Auth user has an admin-portal claim
 * (admin | super_admin | moderator → AppRole.Admin).
 */
export async function isSeoActionTaskAdminUid(uid: string): Promise<boolean> {
  const trimmed = uid.trim();
  if (!trimmed) return false;
  try {
    const record = await getAdminAuth().getUser(trimmed);
    return canAccessAdminPortal(appRoleFromClaims(record.customClaims ?? {}));
  } catch {
    return false;
  }
}
