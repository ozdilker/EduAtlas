"use client";

import { PublicPageShell } from "@eduatlas/ui";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export type PublicShellProps = {
  children: ReactNode;
  appName: string;
  /** Favorilerim only after parent (veli) session. */
  isParentLoggedIn?: boolean;
};

/**
 * App-router shell that passes the current path for nav current-page state.
 */
export function PublicShell({
  children,
  appName,
  isParentLoggedIn = false,
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
    >
      {children}
    </PublicPageShell>
  );
}
