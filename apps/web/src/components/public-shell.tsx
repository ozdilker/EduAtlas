"use client";

import { PublicPageShell, type SiteFooterContact, type SiteHeaderAuthAccount } from "@eduatlas/ui";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export type PublicShellProps = {
  children: ReactNode;
  appName: string;
  /** Favorilerim only after parent (veli) session. */
  isParentLoggedIn?: boolean;
  authAccount?: SiteHeaderAuthAccount | null;
  organizationContact?: SiteFooterContact;
};

/**
 * App-router shell that passes the current path for nav current-page state.
 */
export function PublicShell({
  children,
  appName,
  isParentLoggedIn = false,
  authAccount = null,
  organizationContact,
}: PublicShellProps) {
  const pathname = usePathname();

  if (pathname?.startsWith("/owner") || pathname?.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <PublicPageShell
      appName={appName}
      currentPath={pathname ?? undefined}
      isParentLoggedIn={isParentLoggedIn}
      authAccount={authAccount}
      {...(organizationContact ? { organizationContact } : {})}
    >
      {children}
    </PublicPageShell>
  );
}
