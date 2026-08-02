import { getPublicEnv } from "@eduatlas/config";
import { createSeoSiteConfig } from "@eduatlas/seo";

/**
 * Resolves the SEO site config from public env with static demo fallbacks.
 */
export function getSeoSiteConfig() {
  const env = getPublicEnv();

  return createSeoSiteConfig({
    siteName: env.NEXT_PUBLIC_APP_NAME,
    siteUrl: env.NEXT_PUBLIC_APP_URL,
    // Public contact used across legal/UI surfaces — omit schema field if removed.
    organizationEmail: "info@eduatlas.com.tr",
  });
}
