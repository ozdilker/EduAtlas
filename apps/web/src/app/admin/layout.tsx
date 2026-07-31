import type { Metadata } from "next";
import type { ReactNode } from "react";
import { assertAdminPortalAccess } from "@/server/auth/guards";

export const metadata: Metadata = {
  title: "Yönetim paneli",
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Admin panel segment — noindex; server-authoritative AuthZ.
 */
export default async function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  await assertAdminPortalAccess("/admin");
  return children;
}
