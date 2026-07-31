import type { Metadata } from "next";
import type { ReactNode } from "react";
import { assertOwnerPortalAccess } from "@/server/auth/guards";

export const metadata: Metadata = {
  title: "Kurum paneli",
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Owner portal segment — noindex; server-authoritative AuthZ.
 */
export default async function OwnerLayout({ children }: Readonly<{ children: ReactNode }>) {
  await assertOwnerPortalAccess("/owner");
  return children;
}
