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

/**
 * Page size for sitemap Firestore iteration (documentId cursor).
 * Avoids repository.list → listAll of the full catalog on the request path.
 */
const SITEMAP_PAGE_SIZE = 1000;

/**
 * Keep each child urlset comfortably under typical serverless response body limits
 * (~4.5MB). ~37k institutions at ~225B/URL ≈ 8.4MB in one file — chunk earlier.
 * Google soft limit remains 50k (SITEMAP_MAX_URLS_PER_FILE); this is a deployment safety cap.
 */
const SITEMAP_URLS_PER_FILE = 20_000;

const SITEMAP_REVALIDATE_SECONDS = 3600;

async function collectPublishedSitemapRefs(
  repository: Awaited<ReturnType<typeof getInstitutionRepository>>,
): Promise<SitemapInstitutionRef[]> {
  if (typeof repository.listPublishedSitemapPage === "function") {
    const refs: SitemapInstitutionRef[] = [];
    let cursorId: string | null = null;

    for (;;) {
      const page = await repository.listPublishedSitemapPage({
        pageSize: SITEMAP_PAGE_SIZE,
        cursorId,
      });

      for (const institution of page.items) {
        const geo = resolveGeoLabels(
          institution.location.cityId,
          institution.location.districtId,
        );
        refs.push(
          Object.freeze({
            slug: institution.slug,
            updatedAt: institution.updatedAt,
            ...(institution.publishedAt ? { publishedAt: institution.publishedAt } : {}),
            createdAt: institution.createdAt,
            citySlug: geo.citySlug,
            districtSlug: geo.districtSlug,
            typeSlug: getInstitutionTypeSlug(institution.primaryType),
          }),
        );
      }

      if (!page.nextCursorId) {
        break;
      }
      cursorId = page.nextCursorId;
    }

    return refs;
  }

  // Legacy adapters without sitemap paging — bounded list page (still prefer not listAll).
  const page = await repository.list({
    filters: { status: InstitutionStatus.Published },
    page: 1,
    pageSize: SITEMAP_PAGE_SIZE,
  });

  return page.items.map((institution) => {
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
}

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

  try {
    const repository = await getInstitutionRepository();
    const institutions = await collectPublishedSitemapRefs(repository);

    return createSitemapSnapshot({
      siteUrl: site.siteUrl,
      generatedAt: new Date().toISOString(),
      institutions,
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "sitemap_snapshot_build_failed",
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      }),
    );
    // Fail soft: valid empty snapshot keeps /sitemap.xml from 500'ing crawlers.
    return createSitemapSnapshot({
      siteUrl: site.siteUrl,
      generatedAt: new Date().toISOString(),
      institutions: [],
    });
  }
}

/**
 * Cached sitemap snapshot — shared by index and all child sitemap routes.
 * Cache key v2: paginated published load (no listAll) + safer chunking.
 */
export async function loadSitemapSnapshot(): Promise<SitemapSnapshot> {
  return unstable_cache(buildSitemapSnapshotUncached, ["eduatlas-sitemap-snapshot-v2"], {
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
    built: buildSitemapDocuments(snapshot, { maxUrlsPerFile: SITEMAP_URLS_PER_FILE }),
  });
}

/** Shorter SWR than before — avoid serving a stale incomplete index for a full day. */
export const SITEMAP_HTTP_CACHE_CONTROL = `public, s-maxage=${SITEMAP_REVALIDATE_SECONDS}, stale-while-revalidate=600`;
