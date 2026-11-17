import { describe, expect, it } from "vitest";
import {
  ClaimRequestStatus,
  InstitutionStatus,
  InstitutionType,
  InstitutionVerification,
  createInstitution,
} from "@eduatlas/domain";
import type { ClaimRequestRepository } from "../claims/claim-request-repository";
import type { InstitutionRepository } from "../institutions/institution-repository";
import { createGa4Snapshot } from "./ga4-snapshot";
import type { Ga4SnapshotRepository } from "./ga4-snapshot-repository";
import { getSeoDashboard } from "./get-seo-dashboard";
import { matchGscInstitutionUrl } from "./match-gsc-institution-url";
import { mergeSeoActionTasks } from "./merge-seo-action-tasks";
import {
  seoActionFingerprintForUrl,
  seoActionSourceKeyForUrl,
} from "./seo-action-fingerprint";
import {
  SeoActionTaskStatus,
  createSeoActionTask,
} from "./seo-action-task";
import type { SeoActionTaskRepository } from "./seo-action-task-repository";
import { buildSeoActionPlan } from "./seo-actions";
import {
  SEO_OPPORTUNITY_THRESHOLDS,
  buildSeoSnapshotOpportunities,
  createSeoSnapshot,
} from "./seo-snapshot";
import type { SeoSnapshotRepository } from "./seo-snapshot-repository";

describe("matchGscInstitutionUrl", () => {
  it("extracts slug from absolute institution URLs", () => {
    expect(
      matchGscInstitutionUrl("https://eduatlas.com.tr/institutions/ozel-enka-anadolu-lisesi"),
    ).toEqual({ status: "matched", slug: "ozel-enka-anadolu-lisesi" });
    expect(
      matchGscInstitutionUrl("https://www.eduatlas.com.tr/institutions/kalem-camlica/"),
    ).toEqual({ status: "matched", slug: "kalem-camlica" });
  });

  it("rejects non-institution paths without guessing", () => {
    expect(matchGscInstitutionUrl("https://eduatlas.com.tr/cities/istanbul")).toEqual({
      status: "unmatched_path",
    });
    expect(matchGscInstitutionUrl("https://eduatlas.com.tr/")).toEqual({
      status: "unmatched_path",
    });
  });

  it("marks invalid URLs", () => {
    expect(matchGscInstitutionUrl("not a url")).toEqual({ status: "invalid_url" });
  });
});

describe("createSeoSnapshot / opportunities", () => {
  it("builds summary from page rows without inventing metrics", () => {
    const snapshot = createSeoSnapshot({
      updatedAt: "2026-11-16T00:00:00.000Z",
      dateRange: { startDate: "2026-10-19", endDate: "2026-11-15" },
      pages: [
        {
          url: "https://eduatlas.com.tr/institutions/a",
          clicks: 10,
          impressions: 200,
          ctr: 0.05,
          position: 8,
        },
        {
          url: "https://eduatlas.com.tr/about",
          clicks: 5,
          impressions: 50,
          ctr: 0.1,
          position: 3,
        },
      ],
      queries: [
        { query: "özel okul istanbul", clicks: 2, impressions: 80, ctr: 0.025, position: 12 },
      ],
    });
    expect(snapshot.summary.clicks).toBe(15);
    expect(snapshot.summary.impressions).toBe(250);
    expect(snapshot.summary.ctr).toBeCloseTo(0.06);
    expect(snapshot.topPages).toHaveLength(2);
  });

  it("flags high-impression low-CTR pages and mid-position queries", () => {
    const opportunities = buildSeoSnapshotOpportunities({
      pages: [
        {
          url: "https://eduatlas.com.tr/institutions/x",
          clicks: 1,
          impressions: SEO_OPPORTUNITY_THRESHOLDS.lowCtrMinImpressions,
          ctr: 0.005,
          position: 15,
        },
        {
          url: "https://eduatlas.com.tr/institutions/y",
          clicks: 20,
          impressions: 50,
          ctr: 0.4,
          position: 2,
        },
      ],
      queries: [
        {
          query: "anaokulu üsküdar",
          clicks: 3,
          impressions: SEO_OPPORTUNITY_THRESHOLDS.midPositionMinImpressions,
          ctr: 0.06,
          position: 7,
        },
        {
          query: "brand exact",
          clicks: 50,
          impressions: 60,
          ctr: 0.8,
          position: 1.2,
        },
      ],
    });
    expect(opportunities.lowCtrPages).toHaveLength(1);
    expect(opportunities.midPositionQueries).toHaveLength(1);
    expect(opportunities.midPositionQueries[0]?.query).toBe("anaokulu üsküdar");
  });
});

describe("getSeoDashboard", () => {
  function createInstitutionFixture(slug: string, name: string) {
    return createInstitution({
      id: `inst_${slug.replace(/-/g, "_")}`,
      name,
      slug,
      primaryType: InstitutionType.PrivateSchool,
      status: InstitutionStatus.Published,
      verification: InstitutionVerification.Unclaimed,
      location: {
        cityId: "istanbul",
        districtId: "istanbul-sariyer",
        address: "Test",
      },
      shortDescription: "Test",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      publishedAt: "2026-01-01T00:00:00.000Z",
    });
  }

  const emptyGa4Repository: Ga4SnapshotRepository = {
    async getLatest() {
      return null;
    },
    async saveLatest(snapshot) {
      return snapshot;
    },
  };

  const emptyTaskRepository: SeoActionTaskRepository = {
    async getByFingerprint() {
      return null;
    },
    async getByFingerprints() {
      return [];
    },
    async listAll() {
      return [];
    },
    async upsert(task) {
      return task;
    },
  };

  it("returns empty state when snapshot is missing", async () => {
    const seoSnapshotRepository: SeoSnapshotRepository = {
      async getLatest() {
        return null;
      },
      async saveLatest(snapshot) {
        return snapshot;
      },
    };
    const institutionRepository = {
      async getBySlug() {
        return null;
      },
      async getById() {
        return null;
      },
      async countAdmin() {
        return 0;
      },
    } as unknown as InstitutionRepository;
    const claimRequestRepository = {
      async listRecent() {
        return [];
      },
    } as unknown as ClaimRequestRepository;

    const dashboard = await getSeoDashboard({
      seoSnapshotRepository,
      ga4SnapshotRepository: emptyGa4Repository,
      seoActionTaskRepository: emptyTaskRepository,
      institutionRepository,
      claimRequestRepository,
    });
    expect(dashboard.hasSnapshot).toBe(false);
    expect(dashboard.summary).toBeNull();
    expect(dashboard.topInstitutionPages).toEqual([]);
    expect(dashboard.topSearchedInstitutions).toEqual([]);
    expect(dashboard.siteSearch.available).toBe(false);
    expect(dashboard.ga4.hasSnapshot).toBe(false);
    expect(dashboard.ownership.pendingClaimRequests).toBe(0);
  });

  it("matches institution pages by slug only", async () => {
    const institution = createInstitutionFixture("ozel-enka-anadolu-lisesi", "ÖZEL ENKA ANADOLU LİSESİ");
    const snapshot = createSeoSnapshot({
      updatedAt: "2026-11-16T12:00:00.000Z",
      dateRange: { startDate: "2026-10-19", endDate: "2026-11-15" },
      pages: [
        {
          url: "https://eduatlas.com.tr/institutions/ozel-enka-anadolu-lisesi",
          clicks: 12,
          impressions: 300,
          ctr: 0.04,
          position: 9,
        },
        {
          url: "https://eduatlas.com.tr/institutions/missing-slug",
          clicks: 1,
          impressions: 40,
          ctr: 0.025,
          position: 20,
        },
      ],
      queries: [],
    });

    const dashboard = await getSeoDashboard({
      seoSnapshotRepository: {
        async getLatest() {
          return snapshot;
        },
        async saveLatest(next) {
          return next;
        },
      },
      ga4SnapshotRepository: emptyGa4Repository,
      seoActionTaskRepository: emptyTaskRepository,
      institutionRepository: {
        async getBySlug(slug: string) {
          return slug === institution.slug ? institution : null;
        },
        async getById() {
          return null;
        },
        async countAdmin(filters?: { verification?: InstitutionVerification }) {
          if (filters?.verification === InstitutionVerification.Unclaimed) return 3;
          return 0;
        },
      } as unknown as InstitutionRepository,
      claimRequestRepository: {
        async listRecent(options?: { status?: ClaimRequestStatus }) {
          expect(options?.status).toBe(ClaimRequestStatus.Pending);
          return [{ id: "c1" }, { id: "c2" }];
        },
      } as unknown as ClaimRequestRepository,
    });

    expect(dashboard.hasSnapshot).toBe(true);
    expect(dashboard.topInstitutionPages).toHaveLength(1);
    expect(dashboard.topInstitutionPages[0]?.institution?.name).toBe("ÖZEL ENKA ANADOLU LİSESİ");
    expect(dashboard.topSearchedInstitutions).toHaveLength(1);
    expect(dashboard.topSearchedInstitutions[0]?.institution.institutionId).toBe(
      institution.id.value,
    );
    expect(dashboard.topSearchedInstitutions[0]?.clicks).toBe(12);
    expect(dashboard.topSearchedInstitutions[0]?.impressions).toBe(300);
    expect(dashboard.siteSearch.available).toBe(false);
    expect(dashboard.unmatchedPages).toHaveLength(1);
    expect(dashboard.ownership.unclaimed).toBe(3);
    expect(dashboard.ownership.pendingClaimRequests).toBe(2);
  });

  it("matches GA4 institution_view rows by id and keeps unmatched", async () => {
    const institution = createInstitutionFixture("kalem-camlica", "Kalem Çamlıca");
    const ga4Snapshot = createGa4Snapshot({
      updatedAt: "2026-11-16T12:00:00.000Z",
      dateRange: { startDate: "2026-10-19", endDate: "2026-11-15" },
      institutionViews: [
        { institutionId: institution.id.value, eventCount: 40 },
        { institutionId: "inst_missing", eventCount: 7 },
      ],
    });

    const dashboard = await getSeoDashboard({
      seoSnapshotRepository: {
        async getLatest() {
          return null;
        },
        async saveLatest(next) {
          return next;
        },
      },
      ga4SnapshotRepository: {
        async getLatest() {
          return ga4Snapshot;
        },
        async saveLatest(next) {
          return next;
        },
      },
      seoActionTaskRepository: emptyTaskRepository,
      institutionRepository: {
        async getBySlug() {
          return null;
        },
        async getById(id: { value: string }) {
          return id.value === institution.id.value ? institution : null;
        },
        async countAdmin() {
          return 0;
        },
      } as unknown as InstitutionRepository,
      claimRequestRepository: {
        async listRecent() {
          return [];
        },
      } as unknown as ClaimRequestRepository,
    });

    expect(dashboard.ga4.hasSnapshot).toBe(true);
    expect(dashboard.ga4.summary?.totalInstitutionViews).toBe(47);
    expect(dashboard.ga4.topInstitutionViews).toHaveLength(2);
    expect(dashboard.ga4.topInstitutionViews[0]?.institution?.name).toBe("Kalem Çamlıca");
    expect(dashboard.ga4.topInstitutionViews[1]?.matchStatus).toBe("unmatched");
    expect(dashboard.ga4.unmatchedCount).toBe(1);
    expect(dashboard.ga4.searchTermInstrumented).toBe(true);
  });
});

describe("createGa4Snapshot", () => {
  it("aggregates institution_view rows without inventing ids", () => {
    const snapshot = createGa4Snapshot({
      updatedAt: "2026-11-16T00:00:00.000Z",
      dateRange: { startDate: "2026-10-19", endDate: "2026-11-15" },
      institutionViews: [
        { institutionId: "inst_b", eventCount: 2 },
        { institutionId: "inst_a", eventCount: 9 },
        { institutionId: "  ", eventCount: 5 },
      ],
    });
    expect(snapshot.summary.totalInstitutionViews).toBe(11);
    expect(snapshot.summary.distinctInstitutionIds).toBe(2);
    expect(snapshot.topInstitutionViews[0]?.institutionId).toBe("inst_a");
  });
});

describe("buildSeoActionPlan", () => {
  it("merges CTR+ranking for the same URL and keeps high priority", () => {
    const plan = buildSeoActionPlan({
      pages: [
        {
          url: "https://eduatlas.com.tr/institutions/a",
          clicks: 2,
          impressions: 600,
          ctr: 0.003,
          position: 8,
          institutionName: "Okul A",
          profileHref: "/institutions/a",
          matchStatus: "matched",
        },
        {
          url: "https://eduatlas.com.tr/institutions/b",
          clicks: 20,
          impressions: 550,
          ctr: 0.04,
          position: 7,
          institutionName: "Okul B",
          profileHref: "/institutions/b",
          matchStatus: "matched",
        },
        {
          url: "https://eduatlas.com.tr/institutions/missing",
          clicks: 1,
          impressions: 120,
          ctr: 0.008,
          position: 15,
          institutionName: null,
          profileHref: null,
          matchStatus: "unmatched",
        },
        {
          url: "https://eduatlas.com.tr/",
          clicks: 11,
          impressions: 514,
          ctr: 0.021,
          position: 6.7,
          institutionName: null,
          profileHref: null,
          matchStatus: "not_institution",
        },
      ],
      queries: [
        {
          query: "üsküdar anaokulu",
          clicks: 3,
          impressions: 250,
          ctr: 0.012,
          position: 9,
          matchedInstitutionName: null,
        },
      ],
    });

    const combined = plan.ctrPageOpportunities.find(
      (row) => row.kind === "ctr_and_ranking_page",
    );
    expect(combined?.targetLabel).toBe("Okul A");
    expect(combined?.priority).toBe("high");
    expect(combined?.title).toBe("CTR + sıralama fırsatı");
    expect(combined?.recommendation).toMatch(/title/i);
    expect(combined?.recommendation).toMatch(/Ardından/);
    expect(combined?.recommendation).toMatch(/profil içeriğini/i);

    // Same URL must not also appear as a separate ranking action.
    expect(
      plan.rankingPageOpportunities.some((row) => row.targetLabel === "Okul A"),
    ).toBe(false);
    expect(
      plan.prioritizedActions.filter((row) => row.targetLabel === "Okul A"),
    ).toHaveLength(1);

    // Ranking-only keeps content advice (CTR already OK).
    const rankingOnly = plan.rankingPageOpportunities.find(
      (row) => row.targetLabel === "Okul B",
    );
    expect(rankingOnly?.recommendation).toMatch(/profil içeriğini/i);
    expect(rankingOnly?.recommendation).not.toMatch(/title ve meta/i);

    // Homepage is not treated as an institution profile.
    const home = plan.rankingPageOpportunities.find(
      (row) => row.targetLabel === "Ana sayfa",
    );
    expect(home?.recommendation).toMatch(/Ana sayfa|kategori|navigasyon/i);
    expect(home?.recommendation).not.toMatch(/profil içeriğini/i);
    expect(home?.institutionName).toBeNull();
    expect(home?.profileHref).toBeNull();

    expect(plan.queryOpportunities[0]?.title).toBe("Arama sorgusu fırsatı");
    expect(plan.unmatchedUrlOpportunities).toHaveLength(1);
    expect(plan.prioritizedActions[0]?.priority).toBe("high");

    // Fingerprint stable across kind change (combined vs ranking-only URL family).
    const url = "https://eduatlas.com.tr/institutions/a";
    expect(combined?.fingerprint).toBe(seoActionFingerprintForUrl(url));
    expect(combined?.sourceKey).toBe(seoActionSourceKeyForUrl(url));
  });

  it("dedupes prioritizedActions by fingerprint when CTR and unmatched share a URL", () => {
    const url = "https://eduatlas.com.tr/institutions/cift-satir";
    const plan = buildSeoActionPlan({
      pages: [
        {
          url,
          clicks: 3,
          impressions: 600,
          ctr: 0.005,
          position: 8,
          institutionName: null,
          profileHref: null,
          matchStatus: "unmatched",
        },
      ],
      queries: [],
    });

    expect(plan.ctrPageOpportunities.some((row) => row.kind === "ctr_and_ranking_page")).toBe(
      true,
    );
    expect(plan.unmatchedUrlOpportunities).toHaveLength(1);
    expect(plan.unmatchedUrlOpportunities[0]?.fingerprint).toBe(
      plan.ctrPageOpportunities[0]?.fingerprint,
    );

    const sameFingerprint = plan.prioritizedActions.filter(
      (row) => row.fingerprint === seoActionFingerprintForUrl(url),
    );
    expect(sameFingerprint).toHaveLength(1);
    expect(sameFingerprint[0]?.kind).toBe("ctr_and_ranking_page");
  });

  it("merges persisted task state without changing metrics and keeps done separate", () => {
    const plan = buildSeoActionPlan({
      pages: [
        {
          url: "https://eduatlas.com.tr/institutions/a",
          clicks: 2,
          impressions: 600,
          ctr: 0.003,
          position: 8,
          institutionName: "Okul A",
          profileHref: "/institutions/a",
          matchStatus: "matched",
        },
      ],
      queries: [],
    });
    const fingerprint = plan.prioritizedActions[0]?.fingerprint;
    expect(fingerprint).toBeTruthy();

    const managed = mergeSeoActionTasks(plan, [
      createSeoActionTask({
        fingerprint: fingerprint!,
        sourceKey: plan.prioritizedActions[0]!.sourceKey,
        status: SeoActionTaskStatus.Done,
        assigneeUid: "admin_1",
        note: "title güncellendi",
        updatedAt: "2026-11-16T15:00:00.000Z",
        updatedBy: "admin_1",
      }),
    ]);

    expect(managed.activeActions).toHaveLength(0);
    expect(managed.completedActions).toHaveLength(1);
    expect(managed.completedActions[0]?.task.status).toBe("done");
    expect(managed.completedActions[0]?.task.assigneeUid).toBe("admin_1");
    expect(managed.completedActions[0]?.impressions).toBe(600);
    expect(managed.completedActions[0]?.kind).toBe("ctr_and_ranking_page");
  });
});
