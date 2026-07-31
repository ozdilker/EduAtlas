"use client";

import { PublicPageShell } from "@eduatlas/ui";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export type PublicShellProps = {
  children: ReactNode;
  appName: string;
};

/**
 * App-router shell that passes the current path for nav current-page state.
 */
export function PublicShell({ children, appName }: PublicShellProps) {
  const pathname = usePathname();

  if (pathname?.startsWith("/owner") || pathname?.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <PublicPageShell appName={appName} currentPath={pathname ?? undefined}>
      {children}
    </PublicPageShell>
  );
}
