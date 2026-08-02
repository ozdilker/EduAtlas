import { buildMetadata } from "../metadata";
import { SchemaEngine } from "../schema";
import type { SeoSiteConfig } from "../types";
import type { PageSeoResult } from "./home";

/** Static demo institution SEO content — used when live institution data is unavailable. */
export const DEMO_INSTITUTION_SEO = {
  name: "Örnek Anaokulu",
  typeLabel: "Anaokulu",
  typeSlug: "anaokulu",
  district: "Kadıköy",
  districtSlug: "kadikoy",
  city: "İstanbul",
  citySlug: "istanbul",
  description:
    "Kadıköy, İstanbul'da örnek anaokulu. Aileler için hazırlanmış statik kurum profili arayüzü.",
} as const;

export type InstitutionPageSeoContent = {
  readonly slug: string;
  readonly name: string;
  readonly typeLabel: string;
  readonly typeSlug: string;
  readonly city: string;
  readonly citySlug: string;
  readonly district: string;
  readonly districtSlug: string;
  readonly description: string;
};

/**
 * Institution profile SEO.
 * Prefer live institution content; falls back to demo fields when only a slug is provided.
 */
export function buildInstitutionPageSeo(
  site: SeoSiteConfig,
  options?: Partial<InstitutionPageSeoContent> & {
    slug?: string;
  },
): PageSeoResult {
  const pathSlug = options?.slug?.trim() || "ornek-anaokulu";
  const path = `/institutions/${pathSlug}`;

  const name = options?.name?.trim() || DEMO_INSTITUTION_SEO.name;
  const typeLabel = options?.typeLabel?.trim() || DEMO_INSTITUTION_SEO.typeLabel;
  const typeSlug = options?.typeSlug?.trim() || DEMO_INSTITUTION_SEO.typeSlug;
  const city = options?.city?.trim() || DEMO_INSTITUTION_SEO.city;
  const citySlug = options?.citySlug?.trim() || DEMO_INSTITUTION_SEO.citySlug;
  const district = options?.district?.trim() || DEMO_INSTITUTION_SEO.district;
  const districtSlug = options?.districtSlug?.trim() || DEMO_INSTITUTION_SEO.districtSlug;
  const description =
    options?.description?.trim() ||
    (options?.name
      ? `${district}, ${city}'da ${name}. ${typeLabel} profili EduAtlas üzerinde.`
      : DEMO_INSTITUTION_SEO.description);

  const metadata = buildMetadata({
    site,
    title: [name, typeLabel, `${district}, ${city}`],
    description,
    path,
  });

  return {
    metadata,
    jsonLd: [
      ...SchemaEngine.build("institution", site, {
        name,
        typeLabel,
        typeSlug,
        city,
        citySlug,
        district,
        districtSlug,
        path,
      }),
    ],
  };
}
