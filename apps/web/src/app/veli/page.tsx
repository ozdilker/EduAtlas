import { ParentProfilePage } from "@eduatlas/ui";
import type { Metadata } from "next";
import { logoutAction } from "@/server/auth/auth-actions";
import { getCurrentUser } from "@/server/auth/current-session";
import { assertParentPortalAccess } from "@/server/auth/guards";

export const metadata: Metadata = {
  title: "Veli profili",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Parent profile — favorites and compare (auth required).
 */
export default async function ParentProfileRoute() {
  await assertParentPortalAccess("/veli");
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return (
    <ParentProfilePage
      displayName={user.displayName}
      email={user.email}
      logoutAction={logoutAction}
    />
  );
}
