import { createBillingProtection, createCampaignSegment, type Institution } from "@eduatlas/domain";
import { describe, expect, it, vi } from "vitest";
import { getInstitutionAcquisitionDashboard } from "../acquisition/get-institution-acquisition-dashboard";
import { validateImport } from "../institution-import/validate-import";
import { getInstitutionReviewQueue } from "../institution-review/get-institution-review-queue";
import { createInstitutionPage, type InstitutionRepository } from "../institutions";
import { previewSegmentInstitutions } from "../outreach/preview-segment-institutions";
import type { BillingProtectionRepository } from "./billing-protection-repository";
import { isBillingProtectionError } from "./errors";

function protectionRepo(
  state: "NORMAL" | "WARNING" | "PROTECTION" | "EMERGENCY",
): BillingProtectionRepository {
  const current = createBillingProtection({ state, source: "manual" });
  return {
    async get() {
      return current;
    },
    async save(protection) {
      return protection;
    },
  };
}

function stubInstitutionRepo(listImpl?: InstitutionRepository["list"]): InstitutionRepository {
  const list =
    listImpl ??
    (async () => {
      throw new Error("list() should not be called");
    });
  return {
    async getById() {
      return null;
    },
    async getBySlug() {
      return null;
    },
    list,
    async save(institution) {
      return institution;
    },
    async update(institution) {
      return institution;
    },
    async delete() {},
  };
}

describe("billing protection integration gates", () => {
  it("blocks import duplicate catalog scan before list()", async () => {
    const list = vi.fn(async () => {
      throw new Error("list should not run");
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(
      validateImport(
        {
          rows: [],
          skipQualityPreview: true,
        },
        {
          institutionRepository: stubInstitutionRepo(list),
          billingProtectionRepository: protectionRepo("PROTECTION"),
        },
      ),
    ).rejects.toSatisfy(isBillingProtectionError);
    expect(list).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("allows import duplicate scan under NORMAL", async () => {
    const list = vi.fn(async () =>
      createInstitutionPage({ items: [], page: 1, pageSize: 1, totalItems: 0 }),
    );
    await validateImport(
      { rows: [], skipQualityPreview: true },
      {
        institutionRepository: stubInstitutionRepo(list),
        billingProtectionRepository: protectionRepo("NORMAL"),
      },
    );
    expect(list).toHaveBeenCalled();
  });

  it("blocks acquisition full-scan branches before list() while bounded path stays open", async () => {
    const list = vi.fn(async () => {
      throw new Error("list should not run");
    });
    const listAdminPage = vi.fn(async () => ({
      items: [] as Institution[],
      pageSize: 50,
      nextCursor: null as string | null,
      hasNextPage: false,
      totalItems: 0,
    }));
    const countAdmin = vi.fn(async () => 0);
    const sumAdminQualityScore = vi.fn(async () => ({ count: 0, sum: 0 }));
    const repo: InstitutionRepository = {
      ...stubInstitutionRepo(list),
      listAdminPage,
      countAdmin,
      sumAdminQualityScore,
    };
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const blocked = await getInstitutionAcquisitionDashboard(
      { queue: "duplicates" },
      {
        institutionRepository: repo,
        billingProtectionRepository: protectionRepo("PROTECTION"),
      },
    );
    expect(blocked.searchNotice).toMatch(/maliyet koruması/i);
    expect(list).not.toHaveBeenCalled();

    const bounded = await getInstitutionAcquisitionDashboard(
      { queue: "all" },
      {
        institutionRepository: repo,
        billingProtectionRepository: protectionRepo("PROTECTION"),
      },
    );
    expect(bounded.usedCatalogScan).toBe(false);
    expect(listAdminPage).toHaveBeenCalled();
    expect(list).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("blocks outreach preview before institution list()", async () => {
    const list = vi.fn(async () => {
      throw new Error("list should not run");
    });
    const segment = createCampaignSegment({
      id: "seg_test",
      name: "Test",
      filters: { cityId: "city_34" },
      createdAt: "2026-08-10T00:00:00.000Z",
      updatedAt: "2026-08-10T00:00:00.000Z",
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(
      previewSegmentInstitutions(
        { segmentId: "seg_test", limit: 10 },
        {
          segmentRepository: {
            async getById() {
              return segment;
            },
            async list() {
              return [segment];
            },
            async save(s) {
              return s;
            },
            async update(s) {
              return s;
            },
          },
          institutionRepository: stubInstitutionRepo(list),
          billingProtectionRepository: protectionRepo("PROTECTION"),
        },
      ),
    ).rejects.toSatisfy(isBillingProtectionError);
    expect(list).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("blocks scoped admin free-text before list() and keeps unscoped short-circuit", async () => {
    const list = vi.fn(async () => {
      throw new Error("list should not run");
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const unscoped = await getInstitutionReviewQueue(
      { queue: "draft", query: "kolej" },
      {
        institutionRepository: stubInstitutionRepo(list),
        billingProtectionRepository: protectionRepo("PROTECTION"),
      },
    );
    expect(unscoped.locationRequired).toBe(true);
    expect(list).not.toHaveBeenCalled();

    const scoped = await getInstitutionReviewQueue(
      { queue: "draft", query: "kolej", cityId: "city_34" },
      {
        institutionRepository: stubInstitutionRepo(list),
        billingProtectionRepository: protectionRepo("PROTECTION"),
      },
    );
    expect(scoped.searchNotice).toMatch(/maliyet koruması/i);
    expect(list).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("WARNING still allows expensive operations", async () => {
    const list = vi.fn(async () =>
      createInstitutionPage({ items: [], page: 1, pageSize: 1, totalItems: 0 }),
    );
    await validateImport(
      { rows: [], skipQualityPreview: true },
      {
        institutionRepository: stubInstitutionRepo(list),
        billingProtectionRepository: protectionRepo("WARNING"),
      },
    );
    expect(list).toHaveBeenCalled();
  });
});
