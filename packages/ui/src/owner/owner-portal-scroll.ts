const OWNER_PORTAL_SCROLL_KEY = "ea-owner-portal-scroll";

/** Persist list scroll before navigating into a lead drawer. */
export function saveOwnerPortalScroll(): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(OWNER_PORTAL_SCROLL_KEY, String(window.scrollY));
}

/** Restore list scroll after drawer open/close navigation. */
export function restoreOwnerPortalScroll(options?: { clear?: boolean }): void {
  if (typeof window === "undefined") {
    return;
  }
  const raw = sessionStorage.getItem(OWNER_PORTAL_SCROLL_KEY);
  if (raw == null) {
    return;
  }
  const y = Number(raw);
  if (Number.isFinite(y)) {
    window.scrollTo(0, y);
  }
  if (options?.clear !== false) {
    sessionStorage.removeItem(OWNER_PORTAL_SCROLL_KEY);
  }
}
