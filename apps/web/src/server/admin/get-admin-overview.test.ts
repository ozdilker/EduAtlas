import { InstitutionStatus } from "@eduatlas/domain";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { countAdmin, listAdminPage, list, getById, getInstitutionAcquisitionDashboard } = vi.hoisted(
  () => ({
    countAdmin: vi.fn(),
    listAdminPage: vi.fn(),
    list: vi.fn(),
    getById: vi.fn(),
    getInstitutionAcquisitionDashboard: vi.fn(async () =>
      Object.freeze({
        generatedAt: "2026-07-14T12:00:00.000Z",
        queue: "all",
        sort: "highest",
        filters: Object.freeze({}),
        statistics: Object.freeze({
          totalInstitutions: 10,
          byCity: Object.freeze([]),
          byType: Object.freeze([]),
          claimRatePercent: 0,
          verificationRatePercent: 0,
          qualityDistribution: Object.freeze({
            low: 1,
            medium: 2,
            healthy: 3,
            excellent: 4,
            byGrade: Object.freeze({}),
            byLevel: Object.freeze({}),
            averageScore: 50,
          }),
          queueCounts: Object.freeze({
            import: 0,
            pending: 0,
            verified: 0,
            claimed: 0,
            duplicates: 0,
            all: 10,
          }),
        }),
        matchedCount: 0,
        pagination: Object.freeze({
          page: 1,
          pageSize: 50,
          totalPages: 1,
          totalItems: 0,
          from: 0,
          to: 0,
        }),
        rows: Object.freeze([]),
        duplicateCandidates: Object.freeze([]),
        availableCities: Object.freeze([]),
        availableDistricts: Object.freeze([]),
        usedCatalogScan: false,
      }),
    ),
  }),
);

vi.mock("../institutions/repository", () => ({
  getInstitutionRepository: async () => ({
    countAdmin,
    listAdminPage,
    list,
    getById,
  }),
}));

vi.mock("../claims/claim-request-repository", () => ({
  getClaimRequestRepository: async () => ({
    listRecent: async () => [],
  }),
}));

vi.mock("@eduatlas/application", async () => {
  const actual =
    await vi.importActual<typeof import("@eduatlas/application")>("@eduatlas/application");
  return {
    ...actual,
    getInstitutionAcquisitionDashboard,
    createAiWorkforceOrchestrator: vi.fn(() => ({})),
    summarizeAiWorkforceFoundation: vi.fn(() => ({ agentCount: 0 })),
  };
});

vi.mock("@eduatlas/firebase/server", () => ({
  resolveGeoLabels: () => ({ cityName: "İstanbul", districtName: "Kadıköy" }),
}));

vi.mock("../institutions/to-profile-view", () => ({
  getInstitutionTypeLabel: () => "Anaokulu",
}));

describe("getAdminOverviewView countAdmin usage", () => {
  beforeEach(() => {
    countAdmin.mockReset();
    listAdminPage.mockReset();
    list.mockReset();
    getById.mockReset();
    getInstitutionAcquisitionDashboard.mockClear();
    listAdminPage.mockResolvedValue({
      items: [],
      pageSize: 6,
      nextCursor: null,
      hasNextPage: false,
      totalItems: 0,
    });
    countAdmin.mockImplementation(async (filters?: { status?: InstitutionStatus }) => {
      switch (filters?.status) {
        case InstitutionStatus.Draft:
          return 3;
        case InstitutionStatus.PendingReview:
          return 5;
        case InstitutionStatus.Published:
          return 7;
        default:
          return 0;
      }
    });
  });

  it("uses countAdmin for draft/pending/published status KPIs", async () => {
    const { getAdminOverviewView } = await import("./get-admin-overview");
    const view = await getAdminOverviewView();

    expect(countAdmin).toHaveBeenCalledWith({ status: InstitutionStatus.Draft });
    expect(countAdmin).toHaveBeenCalledWith({ status: InstitutionStatus.PendingReview });
    expect(countAdmin).toHaveBeenCalledWith({ status: InstitutionStatus.Published });
    expect(view.health.draftCount).toBe(3);
    expect(view.health.pendingReviewCount).toBe(5);
    expect(view.health.publishedCount).toBe(7);
  });

  it("loads acquisition KPIs in lightweight mode and never list(50_000)", async () => {
    const { getAdminOverviewView } = await import("./get-admin-overview");
    await getAdminOverviewView();

    expect(getInstitutionAcquisitionDashboard).toHaveBeenCalledWith(
      expect.objectContaining({ lightweight: true }),
      expect.anything(),
    );
    expect(list).not.toHaveBeenCalled();
    expect(listAdminPage).toHaveBeenCalled();
  });
});
