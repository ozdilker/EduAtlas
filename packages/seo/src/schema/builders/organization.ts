import type { JsonLdObject, SeoPostalAddress, SeoSiteConfig } from "../../types";
import { resolveOrganizationSchemaId, resolveSiteOriginUrl } from "../ids";
import {
  EDUATLAS_ALTERNATE_NAME,
  ORGANIZATION_AREA_SERVED,
  ORGANIZATION_KNOWS_ABOUT,
} from "../organization-constants";
import { SchemaOrgType } from "../types";

export type OrganizationSchemaBuildInput = Readonly<{
  /** Home page meta description from MetadataEngine. */
  readonly description: string;
}>;

function hasAddressContent(address: SeoPostalAddress | undefined): boolean {
  if (!address) {
    return false;
  }
  return Boolean(
    address.streetAddress?.trim() ||
      address.addressLocality?.trim() ||
      address.addressRegion?.trim() ||
      address.postalCode?.trim() ||
      address.addressCountry?.trim(),
  );
}

function buildPostalAddress(address: SeoPostalAddress): JsonLdObject {
  return Object.freeze({
    "@type": "PostalAddress",
    ...(address.streetAddress?.trim() ? { streetAddress: address.streetAddress.trim() } : {}),
    ...(address.addressLocality?.trim()
      ? { addressLocality: address.addressLocality.trim() }
      : {}),
    ...(address.addressRegion?.trim() ? { addressRegion: address.addressRegion.trim() } : {}),
    ...(address.postalCode?.trim() ? { postalCode: address.postalCode.trim() } : {}),
    ...(address.addressCountry?.trim()
      ? { addressCountry: address.addressCountry.trim() }
      : {}),
  });
}

function resolveSameAs(site: SeoSiteConfig): readonly string[] {
  return Object.freeze(
    (site.organizationSameAs ?? [])
      .map((url) => url.trim())
      .filter((url) => url.length > 0),
  );
}

/**
 * Schema.org Organization builder for EduAtlas (platform), not institutions.
 * Emitted only on the home graph via SchemaEngine registry.
 */
export const OrganizationSchemaBuilder = {
  build(site: SeoSiteConfig, input: OrganizationSchemaBuildInput): JsonLdObject {
    const origin = resolveSiteOriginUrl(site);
    const description =
      input.description.trim() || site.defaultDescription?.trim() || "";
    const sameAs = resolveSameAs(site);
    const inLanguage = site.locale?.replace("_", "-") || "tr-TR";

    const organization: JsonLdObject = {
      "@context": "https://schema.org",
      "@type": SchemaOrgType.Organization,
      "@id": resolveOrganizationSchemaId(site),
      name: site.siteName,
      alternateName: EDUATLAS_ALTERNATE_NAME,
      url: origin,
      description,
      knowsAbout: [...ORGANIZATION_KNOWS_ABOUT],
      areaServed: ORGANIZATION_AREA_SERVED,
      inLanguage,
    };

    if (site.logoUrl?.trim()) {
      organization.logo = site.logoUrl.trim();
    }

    if (site.defaultImageUrl?.trim()) {
      organization.image = site.defaultImageUrl.trim();
    }

    if (site.organizationEmail?.trim()) {
      organization.email = site.organizationEmail.trim();
    }

    if (site.organizationTelephone?.trim()) {
      organization.telephone = site.organizationTelephone.trim();
    }

    if (hasAddressContent(site.organizationAddress)) {
      organization.address = buildPostalAddress(site.organizationAddress!);
    }

    if (site.organizationFoundingDate?.trim()) {
      organization.foundingDate = site.organizationFoundingDate.trim();
    }

    if (sameAs.length > 0) {
      organization.sameAs = [...sameAs];
    }

    return Object.freeze(organization);
  },
} as const;
