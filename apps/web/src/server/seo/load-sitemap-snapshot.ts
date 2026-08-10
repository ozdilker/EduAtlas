import { assertOperationAllowed, isBillingProtectionError } from "@eduatlas/application";
import { getInstitutionTypeSlug, InstitutionStatus } from "@eduatlas/domain";
import { resolveGeoLabels } from "@eduatlas/firebase/server";
import {
  buildSitemapDocuments,
  createSitemapSnapshot,
  type SitemapBuildResult,
  type SitemapInstitutionRef,
  type SitemapSnapshot,
} from "@eduatlas/seo";
import { unstable_cache } from "next/cache";
import { getSeoSiteConfig } from "@/lib/seo-site";
import { getBillingProtectionDeps } from "@/server/billing-protection/repository";
import { getInstitutionRepository } from "@/server/institutions/repository";

/** Single list page large enough for current + near-term catalog sizes. */
const SITEMAP_LIST_PAGE_SIZE = 100_000;

const SITEMAP_REVALIDATE_SECONDS = 3600;

async function buildSitemapSnapshotUncached(): Promise<SitemapSnapshot> {
  const site = getSeoSiteConfig();

  try {
    await assertOperationAllowed("SITEMAP_SCAN", await getBillingProtectionDeps());
  } catch (error) {
    if (isBillingProtectionError(error)) {
      return createSitemapSnapshot({
        siteUrl: site.siteUrl,
        generatedAt: new Date().toISOString(),
        institutions: [],
      });
    }
    throw error;
  }

  const repository = await getInstitutionRepository();

  // One repository.list → one store.listAll (filtered to Published in memory).
  const page = await repository.list({
    filters: { status: InstitutionStatus.Published },
    page: 1,
    pageSize: SITEMAP_LIST_PAGE_SIZE,
  });

  const institutions: SitemapInstitutionRef[] = page.items.map((institution) => {
    const geo = resolveGeoLabels(institution.location.cityId, institution.location.districtId);
    return Object.freeze({
      slug: institution.slug,
      updatedAt: institution.updatedAt,
      ...(institution.publishedAt ? { publishedAt: institution.publishedAt } : {}),
      createdAt: institution.createdAt,
      citySlug: geo.citySlug,
      districtSlug: geo.districtSlug,
      typeSlug: getInstitutionTypeSlug(institution.primaryType),
    });
  });

  return createSitemapSnapshot({
    siteUrl: site.siteUrl,
    generatedAt: new Date().toISOString(),
    institutions,
  });
}

/**
 * Cached sitemap snapshot — shared by index and all child sitemap routes.
 */
export async function loadSitemapSnapshot(): Promise<SitemapSnapshot> {
  return unstable_cache(buildSitemapSnapshotUncached, ["eduatlas-sitemap-snapshot-v1"], {
    revalidate: SITEMAP_REVALIDATE_SECONDS,
    tags: ["sitemap"],
  })();
}

export type LoadedSitemapDocuments = Readonly<{
  readonly snapshot: SitemapSnapshot;
  readonly built: SitemapBuildResult;
}>;

/**
 * Builds index children + urlsets from the cached snapshot (no extra Firestore reads).
 */
export async function loadSitemapDocuments(): Promise<LoadedSitemapDocuments> {
  const snapshot = await loadSitemapSnapshot();
  return Object.freeze({
    snapshot,
    built: buildSitemapDocuments(snapshot),
  });
}

export const SITEMAP_HTTP_CACHE_CONTROL = `public, s-maxage=${SITEMAP_REVALIDATE_SECONDS}, stale-while-revalidate=86400`;
