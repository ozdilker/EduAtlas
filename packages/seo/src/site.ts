import type { SeoSiteConfig } from "./types";

export const DEFAULT_SEO_SITE_URL = "https://eduatlas.com";

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
  const siteUrl = (overrides?.siteUrl?.trim() || DEFAULT_SEO_SITE_URL).replace(/\/+$/, "");

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
  };
}
