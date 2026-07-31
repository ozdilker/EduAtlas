import { logoutAction } from "@/server/auth/auth-actions";

/**
 * POST /logout — clears session via AuthenticationService (no UI Firebase).
 */
export async function POST() {
  await logoutAction();
}
