"use client";

import { useId, useState } from "react";
import { EduAtlasLogo } from "../brand/eduatlas-logo";
import { getButtonClassName } from "../components/button-classes";
import { Container } from "../components/container";
import { cn } from "../lib/cn";
import {
  getPrimaryNavItems,
  getPriorityCategoryLinks,
  getPriorityCityLinks,
  isNavItemActive,
} from "./navigation";

export type SiteHeaderAuthAccount = Readonly<{
  /** Visible name (displayName or email local-part). */
  readonly label: string;
  /** Portal home for the signed-in role. */
  readonly href: string;
  /** Optional short role label for aria / mobile. */
  readonly roleLabel?: string;
}>;

export type SiteHeaderProps = {
  appName?: string;
  currentPath?: string;
  className?: string;
  /** Show Favorilerim only after parent (veli) login. */
  isParentLoggedIn?: boolean;
  /** When set, login CTAs are replaced by the signed-in account chip. */
  authAccount?: SiteHeaderAuthAccount | null;
};

/**
 * Public site header — official logo, nav, CTAs (concept board).
 */
export function SiteHeader({
  appName = "EduAtlas",
  currentPath,
  className,
  isParentLoggedIn = false,
  authAccount = null,
}: SiteHeaderProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mobileNavId = useId();
  const navItems = getPrimaryNavItems();
  const cityLinks = getPriorityCityLinks().slice(0, 4);
  const categoryLinks = getPriorityCategoryLinks().slice(0, 4);
  const isSignedIn = Boolean(authAccount);

  return (
    <header className={cn("ea-header", className)}>
      <Container size="xl" className="ea-header__inner">
        <a href="/" className="ea-header__logo" aria-label={`${appName} ana sayfa`}>
          <EduAtlasLogo variant="full" title={appName} />
        </a>

        <nav className="ea-header__nav" aria-label="Birincil">
          <ul className="ea-header__nav-list">
            {navItems.map((item) => {
              const current = isNavItemActive(item.href, currentPath);

              return (
                <li key={item.id}>
                  <a
                    href={item.href}
                    className={cn("ea-header__nav-link", current && "ea-header__nav-link--current")}
                    aria-current={current ? "page" : undefined}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {isParentLoggedIn ? (
          <a
            href="/veli"
            className={cn(
              "ea-header__favorites",
              isNavItemActive("/veli", currentPath) && "ea-header__favorites--current",
            )}
            aria-label="Favorilerim ve veli profili"
          >
            <span className="ea-header__favorites-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="ea-header__favorites-label">Favorilerim</span>
          </a>
        ) : null}

        <div className="ea-header__actions">
          {isSignedIn && authAccount ? (
            <a
              href={authAccount.href}
              className={cn(
                getButtonClassName({ variant: "secondary", size: "sm" }),
                "ea-header__cta ea-header__cta--account",
                isNavItemActive(authAccount.href, currentPath) && "ea-header__cta--account-current",
              )}
              aria-label={
                authAccount.roleLabel
                  ? `${authAccount.roleLabel}: ${authAccount.label}`
                  : `Hesabım: ${authAccount.label}`
              }
            >
              <span className="ea-header__account-label">{authAccount.label}</span>
            </a>
          ) : (
            <>
              <a
                href="/login"
                className={cn(
                  getButtonClassName({ variant: "secondary", size: "sm" }),
                  "ea-header__cta ea-header__cta--outline",
                )}
              >
                Kurum Girişi
              </a>
              <a
                href="/veli/giris"
                className={cn(
                  getButtonClassName({ variant: "primary", size: "sm" }),
                  "ea-header__cta ea-header__cta--pill",
                )}
              >
                Veli Girişi
              </a>
            </>
          )}
        </div>

        <button
          type="button"
          className="ea-header__menu-button"
          aria-expanded={mobileNavOpen}
          aria-controls={mobileNavId}
          onClick={() => setMobileNavOpen((open) => !open)}
        >
          {mobileNavOpen ? "Kapat" : "Menü"}
        </button>
      </Container>

      <div
        id={mobileNavId}
        className={cn("ea-header__mobile", mobileNavOpen && "ea-header__mobile--open")}
        hidden={!mobileNavOpen}
      >
        <Container size="xl">
          <nav aria-label="Mobil birincil">
            <ul className="ea-header__mobile-list">
              {isSignedIn && authAccount ? (
                <li>
                  <a
                    href={authAccount.href}
                    aria-current={
                      isNavItemActive(authAccount.href, currentPath) ? "page" : undefined
                    }
                  >
                    {authAccount.label}
                    {authAccount.roleLabel ? ` (${authAccount.roleLabel})` : ""}
                  </a>
                </li>
              ) : null}
              {isParentLoggedIn ? (
                <li>
                  <a
                    href="/veli"
                    aria-current={isNavItemActive("/veli", currentPath) ? "page" : undefined}
                  >
                    Favorilerim
                  </a>
                </li>
              ) : null}
              <li>
                <a
                  href="/search"
                  aria-current={isNavItemActive("/search", currentPath) ? "page" : undefined}
                >
                  Ara
                </a>
              </li>
              {navItems.map((item) => {
                const current = isNavItemActive(item.href, currentPath);

                return (
                  <li key={item.id}>
                    <a href={item.href} aria-current={current ? "page" : undefined}>
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <nav className="ea-header__mobile-secondary" aria-label="Popüler şehirler">
            <p className="ea-header__mobile-heading">Popüler şehirler</p>
            <ul className="ea-header__mobile-chips">
              {cityLinks.map((item) => (
                <li key={item.id}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
              <li>
                <a href="/cities">Tümü</a>
              </li>
            </ul>
          </nav>

          <nav className="ea-header__mobile-secondary" aria-label="Popüler kurum tipleri">
            <p className="ea-header__mobile-heading">Kurum tipleri</p>
            <ul className="ea-header__mobile-chips">
              {categoryLinks.map((item) => (
                <li key={item.id}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
              <li>
                <a href="/categories">Tümü</a>
              </li>
            </ul>
          </nav>

          <div className="ea-header__mobile-cta">
            {isSignedIn && authAccount ? (
              <a
                href={authAccount.href}
                className={cn(getButtonClassName({ variant: "primary", size: "md" }))}
              >
                Hesabım
              </a>
            ) : (
              <>
                <a
                  href="/veli/giris"
                  className={cn(getButtonClassName({ variant: "primary", size: "md" }))}
                >
                  Veli Girişi
                </a>
                <a href="/login" className="ea-header__mobile-login">
                  Kurum Girişi
                </a>
                <a href="/register" className="ea-header__mobile-login">
                  Kurumunu Kaydet
                </a>
              </>
            )}
          </div>
        </Container>
      </div>
    </header>
  );
}
