import {
  ClaimRequestStatus,
  InstitutionVerification,
  createInstitutionId,
  institutionIdAsString,
  type Institution,
} from "@eduatlas/domain";
import type { ClaimRequestRepository } from "../claims/claim-request-repository";
import type { InstitutionRepository } from "../institutions/institution-repository";
import {
  GA4_SNAPSHOT_LIMITS,
  type Ga4Snapshot,
  type Ga4SnapshotSummary,
} from "./ga4-snapshot";
import type { Ga4SnapshotRepository } from "./ga4-snapshot-repository";
import { matchGscInstitutionUrl } from "./match-gsc-institution-url";
import {
  EMPTY_SEO_MANAGED_ACTION_PLAN,
  mergeSeoActionTasks,
  type SeoManagedActionPlan,
} from "./merge-seo-action-tasks";
import { EMPTY_SEO_ACTION_PLAN, buildSeoActionPlan } from "./seo-actions";
import type { SeoActionTaskRepository } from "./seo-action-task-repository";
import {
  SEO_OPPORTUNITY_THRESHOLDS,
  type SeoSnapshot,
  type SeoSnapshotOpportunities,
  type SeoSnapshotPageRow,
  type SeoSnapshotQueryRow,
  type SeoSnapshotSummary,
  buildSeoSnapshotOpportunities,
} from "./seo-snapshot";
import type { SeoSnapshotRepository } from "./seo-snapshot-repository";

export type SeoOwnershipSummary = Readonly<{
  readonly unclaimed: number;
  readonly pending: number;
  readonly verified: number;
  readonly revoked: number;
  readonly pendingClaimRequests: number;
}>;

export type SeoMatchedInstitution = Readonly<{
  readonly institutionId: string;
  readonly name: string;
  readonly slug: string;
  readonly cityId: string;
  readonly districtId: string;
  readonly verification: InstitutionVerification;
  readonly adminHref: string;
  readonly profileHref: string;
}>;

export type SeoDashboardPageRow = Readonly<{
  readonly url: string;
  readonly clicks: number;
  readonly impressions: number;
  readonly ctr: number;
  readonly position: number;
  readonly matchStatus: "matched" | "unmatched" | "ambiguous" | "not_institution";
  readonly institution: SeoMatchedInstitution | null;
}>;

export type SeoDashboardQueryRow = Readonly<{
  readonly query: string;
  readonly clicks: number;
  readonly impressions: number;
  readonly ctr: number;
  readonly position: number;
  readonly matchedInstitutionName: string | null;
}>;

export type SeoGa4InstitutionViewRow = Readonly<{
  readonly institutionId: string;
  readonly eventCount: number;
  readonly matchStatus: "matched" | "unmatched";
  readonly institution: SeoMatchedInstitution | null;
}>;

export type SeoGa4Dashboard = Readonly<{
  readonly hasSnapshot: boolean;
  readonly updatedAt: string | null;
  readonly dateRange: Ga4Snapshot["dateRange"] | null;
  readonly summary: Ga4SnapshotSummary | null;
  readonly topInstitutionViews: readonly SeoGa4InstitutionViewRow[];
  readonly unmatchedCount: number;
  readonly searchTermInstrumented: boolean;
  readonly eventsInstrumented: readonly string[];
  readonly analyticsConsoleHint: string;
}>;

export type SeoSearchedInstitutionRow = Readonly<{
  readonly institution: SeoMatchedInstitution;
  readonly clicks: number;
  readonly impressions: number;
  readonly ctr: number;
  readonly position: number;
}>;

/** On-site search is a separate source from Google Search Console. */
export type SeoSiteSearchStatus = Readonly<{
  readonly available: boolean;
  readonly message: string;
}>;

export type SeoDashboard = Readonly<{
  readonly hasSnapshot: boolean;
  readonly updatedAt: string | null;
  readonly dateRange: SeoSnapshot["dateRange"] | null;
  readonly summary: SeoSnapshotSummary | null;
  readonly topSearchedInstitutions: readonly SeoSearchedInstitutionRow[];
  readonly siteSearch: SeoSiteSearchStatus;
  readonly topInstitutionPages: readonly SeoDashboardPageRow[];
  readonly topQueries: readonly SeoDashboardQueryRow[];
  readonly opportunities: SeoSnapshotOpportunities;
  readonly actionPlan: SeoManagedActionPlan;
  readonly unmatchedPages: readonly SeoDashboardPageRow[];
  readonly ownership: SeoOwnershipSummary;
  readonly ga4: SeoGa4Dashboard;
}>;

export type GetSeoDashboardDependencies = Readonly<{
  readonly seoSnapshotRepository: SeoSnapshotRepository;
  readonly ga4SnapshotRepository: Ga4SnapshotRepository;
  readonly seoActionTaskRepository: SeoActionTaskRepository;
  readonly institutionRepository: InstitutionRepository;
  readonly claimRequestRepository: ClaimRequestRepository;
}>;

function toMatchedInstitution(institution: Institution): SeoMatchedInstitution {
  const id = institutionIdAsString(institution.id);
  return Object.freeze({
    institutionId: id,
    name: institution.name,
    slug: institution.slug,
    cityId: institution.location.cityId,
    districtId: institution.location.districtId,
    verification: institution.verification,
    adminHref: `/admin/acquisition?q=${encodeURIComponent(institution.slug)}`,
    profileHref: `/institutions/${encodeURIComponent(institution.slug)}`,
  });
}

async function resolvePageRow(
  row: SeoSnapshotPageRow,
  institutionRepository: InstitutionRepository,
  cache: Map<string, Institution | null>,
): Promise<SeoDashboardPageRow> {
  const match = matchGscInstitutionUrl(row.url);
  if (match.status === "invalid_url" || match.status === "unmatched_path") {
    return Object.freeze({
      ...row,
      matchStatus: match.status === "unmatched_path" ? "not_institution" : "unmatched",
      institution: null,
    });
  }
  if (match.status === "ambiguous") {
    return Object.freeze({
      ...row,
      matchStatus: "ambiguous",
      institution: null,
    });
  }

  let institution = cache.get(match.slug);
  if (institution === undefined) {
    institution = await institutionRepository.getBySlug(match.slug);
    cache.set(match.slug, institution);
  }

  if (!institution) {
    return Object.freeze({
      ...row,
      matchStatus: "unmatched",
      institution: null,
    });
  }

  return Object.freeze({
    ...row,
    matchStatus: "matched",
    institution: toMatchedInstitution(institution),
  });
}

async function loadOwnershipSummary(
  deps: GetSeoDashboardDependencies,
): Promise<SeoOwnershipSummary> {
  const count = async (verification: InstitutionVerification) => {
    if (!deps.institutionRepository.countAdmin) return 0;
    return deps.institutionRepository.countAdmin({ verification });
  };

  const [unclaimed, pending, verified, revoked, pendingClaims] = await Promise.all([
    count(InstitutionVerification.Unclaimed),
    count(InstitutionVerification.Pending),
    count(InstitutionVerification.Verified),
    count(InstitutionVerification.Revoked),
    deps.claimRequestRepository.listRecent({
      status: ClaimRequestStatus.Pending,
      limit: 100,
    }),
  ]);

  return Object.freeze({
    unclaimed,
    pending,
    verified,
    revoked,
    pendingClaimRequests: pendingClaims.length,
  });
}

const SITE_SEARCH_UNAVAILABLE: SeoSiteSearchStatus = Object.freeze({
  available: false,
  message:
    "İç site arama kaydı yok. Google aramalarıyla karıştırılmaz; bu metrik için tutulmuş bir kaynak bulunmuyor.",
});

function rankSearchedInstitutions(
  pages: readonly SeoDashboardPageRow[],
): readonly SeoSearchedInstitutionRow[] {
  const groups = new Map<
    string,
    {
      institution: SeoMatchedInstitution;
      clicks: number;
      impressions: number;
      weightedPosition: number;
    }
  >();

  for (const page of pages) {
    if (page.matchStatus !== "matched" || !page.institution) continue;
    const id = page.institution.institutionId;
    const current = groups.get(id) ?? {
      institution: page.institution,
      clicks: 0,
      impressions: 0,
      weightedPosition: 0,
    };
    current.clicks += page.clicks;
    current.impressions += page.impressions;
    current.weightedPosition += page.position * Math.max(page.impressions, 0);
    groups.set(id, current);
  }

  return Object.freeze(
    [...groups.values()]
      .map((group) =>
        Object.freeze({
          institution: group.institution,
          clicks: group.clicks,
          impressions: group.impressions,
          ctr: group.impressions > 0 ? group.clicks / group.impressions : 0,
          position: group.impressions > 0 ? group.weightedPosition / group.impressions : 0,
        }),
      )
      .sort(
        (a, b) =>
          b.clicks - a.clicks ||
          b.impressions - a.impressions ||
          a.institution.name.localeCompare(b.institution.name, "tr"),
      ),
  );
}

const EMPTY_OPPORTUNITIES: SeoSnapshotOpportunities = Object.freeze({
  lowCtrPages: Object.freeze([]),
  midPositionQueries: Object.freeze([]),
  unmatchedInstitutionPages: Object.freeze([]),
});

const GA4_EVENTS = Object.freeze([
  "institution_view",
  "search",
  "website_click",
  "phone_click",
  "map_click",
  "whatsapp_click",
  "lead_submitted",
  "claim_profile_started",
  "claim_profile_completed",
] as const);

async function resolveGa4Views(
  ga4Snapshot: Ga4Snapshot | null,
  institutionRepository: InstitutionRepository,
): Promise<SeoGa4Dashboard> {
  const base = Object.freeze({
    searchTermInstrumented: true,
    eventsInstrumented: GA4_EVENTS,
    analyticsConsoleHint: "https://analytics.google.com/",
  });

  if (!ga4Snapshot) {
    return Object.freeze({
      hasSnapshot: false,
      updatedAt: null,
      dateRange: null,
      summary: null,
      topInstitutionViews: Object.freeze([]),
      unmatchedCount: 0,
      ...base,
    });
  }

  const idCache = new Map<string, Institution | null>();
  const resolved: SeoGa4InstitutionViewRow[] = [];

  for (const row of ga4Snapshot.topInstitutionViews) {
    let institution: Institution | null | undefined = idCache.get(row.institutionId);
    if (institution === undefined) {
      try {
        const id = createInstitutionId(row.institutionId);
        institution = await institutionRepository.getById(id);
      } catch {
        institution = null;
      }
      idCache.set(row.institutionId, institution);
    }

    if (institution) {
      resolved.push(
        Object.freeze({
          institutionId: row.institutionId,
          eventCount: row.eventCount,
          matchStatus: "matched",
          institution: toMatchedInstitution(institution),
        }),
      );
    } else {
      resolved.push(
        Object.freeze({
          institutionId: row.institutionId,
          eventCount: row.eventCount,
          matchStatus: "unmatched",
          institution: null,
        }),
      );
    }
  }

  const unmatchedCount = resolved.filter((row) => row.matchStatus === "unmatched").length;

  return Object.freeze({
    hasSnapshot: true,
    updatedAt: ga4Snapshot.updatedAt,
    dateRange: ga4Snapshot.dateRange,
    summary: ga4Snapshot.summary,
    topInstitutionViews: Object.freeze(
      resolved.slice(0, GA4_SNAPSHOT_LIMITS.dashboardTopViews),
    ),
    unmatchedCount,
    ...base,
  });
}

/**
 * Admin SEO dashboard: reads GSC + GA4 snapshots + bounded ownership counts.
 * Does not call Google APIs.
 */
export async function getSeoDashboard(
  deps: GetSeoDashboardDependencies,
): Promise<SeoDashboard> {
  const [snapshot, ga4Snapshot, ownership] = await Promise.all([
    deps.seoSnapshotRepository.getLatest(),
    deps.ga4SnapshotRepository.getLatest(),
    loadOwnershipSummary(deps),
  ]);

  const ga4 = await resolveGa4Views(ga4Snapshot, deps.institutionRepository);

  if (!snapshot) {
    const persistedTasks = await deps.seoActionTaskRepository.listAll();
    const actionPlan =
      persistedTasks.length === 0
        ? EMPTY_SEO_MANAGED_ACTION_PLAN
        : mergeSeoActionTasks(EMPTY_SEO_ACTION_PLAN, persistedTasks);
    return Object.freeze({
      hasSnapshot: false,
      updatedAt: null,
      dateRange: null,
      summary: null,
      topSearchedInstitutions: Object.freeze([]),
      siteSearch: SITE_SEARCH_UNAVAILABLE,
      topInstitutionPages: Object.freeze([]),
      topQueries: Object.freeze([]),
      opportunities: EMPTY_OPPORTUNITIES,
      actionPlan,
      unmatchedPages: Object.freeze([]),
      ownership,
      ga4,
    });
  }

  const cache = new Map<string, Institution | null>();
  const resolvedPages: SeoDashboardPageRow[] = [];
  for (const page of snapshot.topPages) {
    resolvedPages.push(await resolvePageRow(page, deps.institutionRepository, cache));
  }

  const institutionPages = resolvedPages.filter((row) => row.matchStatus === "matched");
  const unmatchedPages = resolvedPages.filter(
    (row) => row.matchStatus === "unmatched" || row.matchStatus === "ambiguous",
  );

  const slugToName = new Map<string, string>();
  for (const row of institutionPages) {
    if (row.institution) {
      slugToName.set(row.institution.slug, row.institution.name);
    }
  }

  // Query→institution is best-effort via URL match only when query equals a known slug (rare).
  // Do not invent name matches — leave null unless exact slug token.
  const topQueries: SeoDashboardQueryRow[] = snapshot.topQueries.map((row) => {
    const folded = row.query.trim().toLocaleLowerCase("tr-TR");
    let matchedInstitutionName: string | null = null;
    for (const [slug, name] of slugToName) {
      if (folded === slug.toLocaleLowerCase("tr-TR")) {
        matchedInstitutionName = name;
        break;
      }
    }
    return Object.freeze({
      query: row.query,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
      matchedInstitutionName,
    });
  });

  const opportunities = buildSeoSnapshotOpportunities({
    pages: snapshot.topPages,
    queries: snapshot.topQueries,
    unmatchedInstitutionPages: unmatchedPages.map((row) =>
      Object.freeze({
        url: row.url,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      }),
    ),
  });

  const derivedPlan = buildSeoActionPlan({
    pages: resolvedPages.map((row) =>
      Object.freeze({
        url: row.url,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
        institutionName: row.institution?.name ?? null,
        profileHref: row.institution?.profileHref ?? null,
        matchStatus: row.matchStatus,
      }),
    ),
    queries: topQueries.map((row) =>
      Object.freeze({
        query: row.query,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
        matchedInstitutionName: row.matchedInstitutionName,
      }),
    ),
  });

  const tasks = await deps.seoActionTaskRepository.listAll();
  const actionPlan = mergeSeoActionTasks(derivedPlan, tasks);

  return Object.freeze({
    hasSnapshot: true,
    updatedAt: snapshot.updatedAt,
    dateRange: snapshot.dateRange,
    summary: snapshot.summary,
    topSearchedInstitutions: rankSearchedInstitutions(institutionPages),
    siteSearch: SITE_SEARCH_UNAVAILABLE,
    topInstitutionPages: Object.freeze(
      institutionPages.slice(0, SEO_OPPORTUNITY_THRESHOLDS.topPagesLimit),
    ),
    topQueries: Object.freeze(topQueries),
    opportunities,
    actionPlan,
    unmatchedPages: Object.freeze(unmatchedPages),
    ownership,
    ga4,
  });
}
