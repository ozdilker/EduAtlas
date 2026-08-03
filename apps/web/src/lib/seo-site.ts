import { createSeoSiteConfig, type SeoSiteConfig } from "@eduatlas/seo";
import { getPublicEnv } from "@eduatlas/config";
import {
  formatOrganizationAddressLine,
  type OrganizationContact,
} from "@eduatlas/domain";

/**
 * Sync SEO defaults (email hardcoded fallback). Prefer `buildSeoSiteConfigFromContact`
 * when organization contact is already loaded.
 */
export function getSeoSiteConfig(): SeoSiteConfig {
  const env = getPublicEnv();

  return createSeoSiteConfig({
    siteName: env.NEXT_PUBLIC_APP_NAME,
    siteUrl: env.NEXT_PUBLIC_APP_URL,
    organizationEmail: "info@eduatlas.com.tr",
  });
}

export function buildSeoSiteConfigFromContact(contact: OrganizationContact): SeoSiteConfig {
  const env = getPublicEnv();
  const hasAddress = Boolean(
    contact.streetAddress ||
      contact.addressLocality ||
      contact.addressRegion ||
      contact.postalCode,
  );

  return createSeoSiteConfig({
    siteName: env.NEXT_PUBLIC_APP_NAME,
    siteUrl: env.NEXT_PUBLIC_APP_URL,
    organizationEmail: contact.email,
    ...(contact.phone ? { organizationTelephone: contact.phone } : {}),
    ...(hasAddress
      ? {
          organizationAddress: {
            ...(contact.streetAddress ? { streetAddress: contact.streetAddress } : {}),
            ...(contact.addressLocality ? { addressLocality: contact.addressLocality } : {}),
            ...(contact.addressRegion ? { addressRegion: contact.addressRegion } : {}),
            ...(contact.postalCode ? { postalCode: contact.postalCode } : {}),
            addressCountry: "TR",
          },
        }
      : {}),
  });
}

export function toFooterContact(contact: OrganizationContact) {
  const addressLine = formatOrganizationAddressLine(contact);
  return {
    email: contact.email,
    ...(contact.phone ? { phone: contact.phone } : {}),
    ...(addressLine ? { addressLine } : {}),
  };
}
