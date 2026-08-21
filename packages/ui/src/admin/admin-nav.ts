import type { AdminShellNavItem } from "./admin-shell";

export type AdminNavBadges = Readonly<{
  readonly review?: number;
  readonly acquisition?: number;
}>;

/**
 * Shared admin sidebar — Overview is the landing destination for `/admin`.
 */
export function buildAdminNavItems(badges: AdminNavBadges = {}): readonly AdminShellNavItem[] {
  return Object.freeze([
    { id: "overview", label: "Genel bakış", href: "/admin" },
    {
      id: "acquisition",
      label: "Kurum edinimi",
      href: "/admin/acquisition",
      ...(typeof badges.acquisition === "number" ? { badge: badges.acquisition } : {}),
    },
    { id: "import", label: "İçe aktarma", href: "/admin/import" },
    { id: "visuals", label: "Site görselleri", href: "/admin/visuals" },
    { id: "site-contact", label: "İletişim bilgileri", href: "/admin/site-contact" },
    { id: "billing", label: "Paketler", href: "/admin/billing" },
    { id: "outreach", label: "Growth Center", href: "/admin/outreach" },
    {
      id: "review",
      label: "İnceleme kuyruğu",
      href: "/admin/review",
      ...(typeof badges.review === "number" ? { badge: badges.review } : {}),
    },
    { id: "site", label: "Ana siteye dön", href: "/" },
  ]);
}
