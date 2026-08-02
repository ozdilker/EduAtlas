import type { SeoSiteConfig } from "./types";

export const DEFAULT_SEO_SITE_URL = "https://eduatlas.com.tr";

/**
 * Returns a usable https origin, or null when the value has no host (e.g. "http://").
 */
export function resolveSiteOrigin(siteUrl: string | undefined): string | null {
  const trimmed = siteUrl?.trim().replace(/\/+$/, "") ?? "";
  if (!trimmed || trimmed === "http:" || trimmed === "https:") {
    return null;
  }

  try {
    const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const url = new URL(withProtocol);
    if (!url.hostname || url.hostname === "http" || url.hostname === "https") {
      return null;
    }
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

/**
 * Static demo site defaults for reusable SEO builders.
 * No dynamic CMS/Firebase data.
 */
export function createSeoSiteConfig(
  overrides?: Partial<SeoSiteConfig> & {
    siteName?: string;
    siteUrl?: string;
  },
): SeoSiteConfig {
  const siteName = overrides?.siteName?.trim() || "EduAtlas";
  const siteUrl = resolveSiteOrigin(overrides?.siteUrl) ?? DEFAULT_SEO_SITE_URL;

  return {
    siteName,
    siteUrl,
    locale: overrides?.locale ?? "tr_TR",
    defaultDescription:
      overrides?.defaultDescription ??
      "Türkiye genelinde anaokulu, dershane ve eğitim kurumlarını keşfedin.",
    logoUrl: overrides?.logoUrl ?? `${siteUrl}/brand/logo.png`,
    defaultImageUrl: overrides?.defaultImageUrl ?? `${siteUrl}/og/default.png`,
    twitterHandle: overrides?.twitterHandle,
    searchPath: overrides?.searchPath?.trim() || "/search",
    searchQueryParam: overrides?.searchQueryParam?.trim() || "q",
    organizationEmail: overrides?.organizationEmail,
    organizationTelephone: overrides?.organizationTelephone,
    organizationAddress: overrides?.organizationAddress,
    organizationFoundingDate: overrides?.organizationFoundingDate,
    organizationSameAs: overrides?.organizationSameAs,
  };
}
