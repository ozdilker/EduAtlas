import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { SiteFooter, type SiteFooterContact } from "./site-footer";
import { SiteHeader, type SiteHeaderAuthAccount } from "./site-header";
import { SkipLink } from "./skip-link";

export type PublicPageShellProps = {
  children: ReactNode;
  appName?: string;
  currentPath?: string;
  className?: string;
  mainClassName?: string;
  /** Show Favorilerim in header/mobile nav only after parent login. */
  isParentLoggedIn?: boolean;
  /** Signed-in account chip; hides Veli/Kurum giriş CTAs when set. */
  authAccount?: SiteHeaderAuthAccount | null;
  logoutAction?: () => Promise<void>;
  organizationContact?: SiteFooterContact;
};

/**
 * Responsive public page wrapper: skip link, header, main, footer.
 */
export function PublicPageShell({
  children,
  appName = "EduAtlas",
  currentPath,
  className,
  mainClassName,
  isParentLoggedIn = false,
  authAccount = null,
  logoutAction,
  organizationContact,
}: PublicPageShellProps) {
  return (
    <div className={cn("ea-page-shell", className)} data-surface="public">
      <SkipLink />
      <SiteHeader
        appName={appName}
        currentPath={currentPath}
        isParentLoggedIn={isParentLoggedIn}
        authAccount={authAccount}
        logoutAction={logoutAction}
      />
      <main id="main-content" className={cn("ea-main", mainClassName)} tabIndex={-1}>
        {children}
      </main>
      <SiteFooter
        appName={appName}
        currentPath={currentPath}
        {...(organizationContact ? { contact: organizationContact } : {})}
      />
    </div>
  );
}
