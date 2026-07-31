import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { SkipLink } from "./skip-link";

export type PublicPageShellProps = {
  children: ReactNode;
  appName?: string;
  currentPath?: string;
  className?: string;
  mainClassName?: string;
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
}: PublicPageShellProps) {
  return (
    <div className={cn("ea-page-shell", className)} data-surface="public">
      <SkipLink />
      <SiteHeader appName={appName} currentPath={currentPath} />
      <main id="main-content" className={cn("ea-main", mainClassName)} tabIndex={-1}>
        {children}
      </main>
      <SiteFooter appName={appName} currentPath={currentPath} />
    </div>
  );
}
