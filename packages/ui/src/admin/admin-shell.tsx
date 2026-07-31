import type { ReactNode } from "react";
import { EduAtlasLogo } from "../brand/eduatlas-logo";
import { cn } from "../lib/cn";

export type AdminShellNavItem = {
  id: string;
  label: string;
  href: string;
  badge?: number;
};

export type AdminShellProps = {
  title?: string;
  children: ReactNode;
  navItems: readonly AdminShellNavItem[];
  activeNavId?: string;
  className?: string;
  /** Optional logout control (server action form). */
  logoutSlot?: ReactNode;
};

/**
 * Dense admin console chrome — separate from public and owner shells.
 */
export function AdminShell({
  title = "EduAtlas Admin",
  children,
  navItems,
  activeNavId,
  className,
  logoutSlot,
}: AdminShellProps) {
  return (
    <div className={cn("ea-admin-shell", className)} data-surface="admin">
      <aside className="ea-admin-shell__sidebar" aria-label="Yönetim paneli">
        <div className="ea-admin-shell__brand">
          <a href="/admin" className="ea-admin-shell__logo">
            <EduAtlasLogo variant="small" title={title} />
            <span>Admin</span>
          </a>
          <p className="ea-admin-shell__tagline">Katalog operasyonları</p>
        </div>

        <nav className="ea-admin-shell__nav" aria-label="Yönetim menüsü">
          {navItems.map((item) => {
            const active = item.id === activeNavId;
            return (
              <a
                key={item.id}
                href={item.href}
                className={cn(
                  "ea-admin-shell__nav-link",
                  active && "ea-admin-shell__nav-link--active",
                )}
                aria-current={active ? "page" : undefined}
              >
                <span>{item.label}</span>
                {typeof item.badge === "number" ? (
                  <span className="ea-admin-shell__badge">
                    {item.badge}
                    <span className="ea-sr-only"> kayıt</span>
                  </span>
                ) : null}
              </a>
            );
          })}
        </nav>

        <div className="ea-admin-shell__footer">
          {logoutSlot ?? (
            <form action="/logout" method="post" className="ea-admin-shell__logout">
              <button type="submit" className="ea-admin-shell__nav-link ea-admin-shell__logout-btn">
                Çıkış yap
              </button>
            </form>
          )}
        </div>
      </aside>

      <div className="ea-admin-shell__body">
        <main className="ea-admin-shell__main" id="admin-main">
          {children}
        </main>
      </div>
    </div>
  );
}
