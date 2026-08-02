import { CanonicalResolver } from "../../canonical";
import type { JsonLdObject, SeoSiteConfig } from "../../types";
import { resolveOrganizationSchemaId } from "../ids";
import { SchemaOrgType } from "../types";

export type EducationalOrganizationSchemaBuildInput = Readonly<{
  readonly name: string;
  /** Profile path e.g. `/institutions/slug`. */
  readonly path: string;
  /** Meta description from MetadataEngine. */
  readonly description: string;
  /** City name for areaServed / PostalAddress. */
  readonly city: string;
  readonly district?: string;
  readonly telephone?: string;
  readonly email?: string;
  /** Full street address text when available. */
  readonly address?: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly coverImageUrl?: string;
  readonly logoUrl?: string;
  /** Official website — becomes sameAs when set. */
  readonly websiteUrl?: string;
}>;

/**
 * Schema.org EducationalOrganization (+ LocalBusiness) for institution profile pages.
 * Extensible later for AggregateRating, Review, OpeningHours, etc. (not this PRD).
 */
export const EducationalOrganizationSchemaBuilder = {
  build(
    site: SeoSiteConfig,
    input: EducationalOrganizationSchemaBuildInput,
  ): JsonLdObject {
    const url = CanonicalResolver.resolve({
      siteUrl: site.siteUrl,
      path: input.path,
    });
    const name = input.name.trim();
    const description = input.description.trim();
    const city = input.city.trim();

    const organization: JsonLdObject = {
      "@context": "https://schema.org",
      "@type": [SchemaOrgType.EducationalOrganization, SchemaOrgType.LocalBusiness],
      "@id": `${url}#educationalorganization`,
      url,
      name,
      description,
      areaServed: city,
      parentOrganization: {
        "@id": resolveOrganizationSchemaId(site),
      },
    };

    const image = resolveInstitutionImage(site, input);
    if (image) {
      organization.image = image;
    }

    const telephone = input.telephone?.trim();
    if (telephone) {
      organization.telephone = telephone;
    }

    const email = input.email?.trim();
    if (email) {
      organization.email = email;
    }

    const address = buildPostalAddress(input);
    if (address) {
      organization.address = address;
    }

    const geo = buildGeoCoordinates(input.latitude, input.longitude);
    if (geo) {
      organization.geo = geo;
    }

    const website = input.websiteUrl?.trim();
    if (website) {
      organization.sameAs = [website];
    }

    return Object.freeze(organization);
  },
} as const;

/** PRD alias. */
export const EducationalOrganizationBuilder = EducationalOrganizationSchemaBuilder;

function resolveInstitutionImage(
  site: SeoSiteConfig,
  input: EducationalOrganizationSchemaBuildInput,
): string | undefined {
  const cover = input.coverImageUrl?.trim();
  if (cover) {
    return cover;
  }
  const logo = input.logoUrl?.trim();
  if (logo) {
    return logo;
  }
  return site.defaultImageUrl?.trim() || undefined;
}

function buildPostalAddress(
  input: EducationalOrganizationSchemaBuildInput,
): JsonLdObject | undefined {
  const street = input.address?.trim();
  if (!street) {
    return undefined;
  }

  const locality = input.district?.trim();
  const region = input.city.trim();

  return Object.freeze({
    "@type": "PostalAddress",
    streetAddress: street,
    ...(locality ? { addressLocality: locality } : {}),
    ...(region ? { addressRegion: region } : {}),
    addressCountry: "TR",
  });
}

function buildGeoCoordinates(
  latitude: number | undefined,
  longitude: number | undefined,
): JsonLdObject | undefined {
  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return undefined;
  }

  return Object.freeze({
    "@type": "GeoCoordinates",
    latitude,
    longitude,
  });
}
