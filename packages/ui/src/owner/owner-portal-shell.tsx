"use client";

import { type ReactNode, useEffect, useId, useState } from "react";
import { EduAtlasLogo } from "../brand/eduatlas-logo";
import { cn } from "../lib/cn";
import { type OwnerPortalTabId, OwnerPortalTabs } from "./owner-portal-tabs";

export type OwnerPortalShellProps = {
  institutionName: string;
  /** Institution-uploaded logo URL; falls back to EduAtlas mark when absent. */
  institutionLogoUrl?: string;
  children: ReactNode;
  activeTab?: OwnerPortalTabId;
  className?: string;
  /** Optional logout control (server action form). No roles in client state. */
  logoutSlot?: ReactNode;
};

/**
 * Owner portal chrome — sticky sidebar on desktop, burger drawer on mobile.
 */
export function OwnerPortalShell({
  institutionName,
  institutionLogoUrl,
  children,
  activeTab,
  className,
  logoutSlot,
}: OwnerPortalShellProps) {
  const logoUrl = institutionLogoUrl?.trim();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  return (
    <div
      className={cn("ea-owner-shell", menuOpen && "ea-owner-shell--menu-open", className)}
      data-surface="owner"
    >
      {menuOpen ? (
        <button
          type="button"
          className="ea-owner-shell__backdrop"
          aria-label="Menüyü kapat"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <aside className="ea-owner-shell__sidebar" aria-label="Kurum paneli">
        <div className="ea-owner-shell__top">
          <div className="ea-owner-shell__brand">
            <a href="/owner" className="ea-owner-shell__logo">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${institutionName} logosu`}
                  className="ea-owner-shell__institution-logo"
                />
              ) : (
                <EduAtlasLogo variant="small" title="EduAtlas Owner" />
              )}
              <span>Owner</span>
            </a>
            <p className="ea-owner-shell__institution">{institutionName}</p>
          </div>

          <button
            type="button"
            className="ea-owner-shell__menu-button"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span
              className={cn(
                "ea-owner-shell__burger",
                menuOpen && "ea-owner-shell__burger--open",
              )}
              aria-hidden="true"
            />
            <span className="ea-sr-only">{menuOpen ? "Menüyü kapat" : "Menüyü aç"}</span>
          </button>
        </div>

        <div
          id={menuId}
          className={cn("ea-owner-shell__panel", menuOpen && "ea-owner-shell__panel--open")}
        >
          {activeTab ? (
            <div className="ea-owner-shell__tabs">
              <OwnerPortalTabs activeTab={activeTab} onNavigate={() => setMenuOpen(false)} />
            </div>
          ) : null}

          <nav className="ea-owner-shell__nav" aria-label="Kurum paneli yardımcı bağlantılar">
            <a href="/" className="ea-owner-shell__nav-link" onClick={() => setMenuOpen(false)}>
              Siteye dön
            </a>
            {logoutSlot ?? (
              <form action="/logout" method="post" className="ea-owner-shell__logout">
                <button
                  type="submit"
                  className="ea-owner-shell__nav-link ea-owner-shell__logout-btn"
                >
                  Çıkış yap
                </button>
              </form>
            )}
          </nav>
        </div>
      </aside>

      <div className="ea-owner-shell__body">
        <main className="ea-owner-shell__main">{children}</main>
      </div>
    </div>
  );
}
