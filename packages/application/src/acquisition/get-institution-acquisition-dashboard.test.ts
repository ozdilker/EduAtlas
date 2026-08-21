import {
  createDraftInstitution,
  createPublishedInstitution,
  type Institution,
  type InstitutionId,
  InstitutionStatus,
  InstitutionType,
  InstitutionVerification,
  institutionIdAsString,
} from "@eduatlas/domain";
import { describe, expect, it, vi } from "vitest";
import {
  createInstitutionPage,
  DuplicateInstitutionError,
  type InstitutionAdminListFilters,
  type InstitutionAdminListPage,
  type InstitutionAdminListPageInput,
  InstitutionNotFoundError,
  type InstitutionRepository,
} from "../institutions";
import {
  buildInstitutionQualityIndicators,
  getInstitutionAcquisitionDashboard,
} from "./get-institution-acquisition-dashboard";

const timestamps = {
  createdAt: "2026-07-14T10:00:00.000Z",
  updatedAt: "2026-07-14T12:00:00.000Z",
};

class InMemoryInstitutionRepository implements InstitutionRepository {
  private readonly byId = new Map<string, Institution>();
  readonly listCalls: unknown[] = [];
  readonly listAdminCalls: InstitutionAdminListPageInput[] = [];

  async getById(id: InstitutionId): Promise<Institution | null> {
    return this.byId.get(institutionIdAsString(id)) ?? null;
  }

  async getBySlug(slug: string): Promise<Institution | null> {
    return [...this.byId.values()].find((item) => item.slug === slug) ?? null;
  }

  async list(options?: { page?: number; pageSize?: number; filters?: { query?: string } }) {
    this.listCalls.push(options);
    let items = [...this.byId.values()];
    if (options?.filters && "query" in (options.filters ?? {}) && options.filters?.query) {
      const needle = options.filters.query.toLocaleLowerCase("tr-TR");
      items = items.filter(
        (item) =>
          item.name.toLocaleLowerCase("tr-TR").includes(needle) ||
          item.slug.toLocaleLowerCase("tr-TR").includes(needle),
      );
    }
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? Math.max(items.length, 1);
    const start = (page - 1) * pageSize;
    return createInstitutionPage({
      items: items.slice(start, start + pageSize),
      page,
      pageSize,
      totalItems: items.length,
    });
  }

  async listAdminPage(input: InstitutionAdminListPageInput): Promise<InstitutionAdminListPage> {
    this.listAdminCalls.push(input);
    let items = [...this.byId.values()];
    const filters = input.filters;
    if (filters?.status) items = items.filter((item) => item.status === filters.status);
    if (filters?.cityId) items = items.filter((item) => item.location.cityId === filters.cityId);
    if (filters?.districtId) {
      items = items.filter((item) => item.location.districtId === filters.districtId);
    }
    if (filters?.primaryType) {
      items = items.filter((item) => item.primaryType === filters.primaryType);
    }
    if (filters?.verification) {
      items = items.filter((item) => item.verification === filters.verification);
    }
    if (filters?.verifications) {
      const verifications = filters.verifications;
      items = items.filter((item) => verifications.includes(item.verification));
    }
    if (typeof filters?.qualityScoreMin === "number") {
      const min = filters.qualityScoreMin;
      items = items.filter((item) => item.qualityScore >= min);
    }
    if (typeof filters?.qualityScoreMaxExclusive === "number") {
      const maxExclusive = filters.qualityScoreMaxExclusive;
      items = items.filter((item) => item.qualityScore < maxExclusive);
    }

    items = [...items].sort((left, right) => {
      if (input.sort === "quality_asc") {
        return left.qualityScore - right.qualityScore || left.name.localeCompare(right.name, "tr");
      }
      return right.qualityScore - left.qualityScore || left.name.localeCompare(right.name, "tr");
    });

    let start = 0;
    if (input.cursor) {
      // Cursor is opaque in production; tests pass null for page 1.
      start = 0;
    }
    const pageItems = items.slice(start, start + input.pageSize);
    const hasMore = start + input.pageSize < items.length;
    return {
      items: pageItems,
      pageSize: input.pageSize,
      nextCursor: hasMore ? "next" : null,
      hasNextPage: hasMore,
      totalItems: items.length,
    };
  }

  async countAdmin(filters?: InstitutionAdminListFilters): Promise<number> {
    const page = await this.listAdminPage({
      pageSize: 50_000,
      sort: "quality_desc",
      filters,
    });
    return page.totalItems;
  }

  async sumAdminQualityScore(
    filters?: InstitutionAdminListFilters,
  ): Promise<{ count: number; sum: number }> {
    const page = await this.listAdminPage({
      pageSize: 50_000,
      sort: "quality_desc",
      filters,
    });
    return {
      count: page.items.length,
      sum: page.items.reduce((acc, item) => acc + item.qualityScore, 0),
    };
  }

  async save(institution: Institution): Promise<Institution> {
    const id = institutionIdAsString(institution.id);
    if (this.byId.has(id) || (await this.getBySlug(institution.slug))) {
      throw new DuplicateInstitutionError({ id: institution.id, slug: institution.slug });
    }
    this.byId.set(id, institution);
    return institution;
  }

  async update(institution: Institution): Promise<Institution> {
    const id = institutionIdAsString(institution.id);
    if (!this.byId.has(id)) {
      throw new InstitutionNotFoundError({ id: institution.id });
    }
    this.byId.set(id, institution);
    return institution;
  }

  async delete(id: InstitutionId): Promise<void> {
    this.byId.delete(institutionIdAsString(id));
  }
}

async function seedRepo(repo: InMemoryInstitutionRepository) {
  await repo.save(
    createDraftInstitution({
      id: "inst_import",
      name: "Yeni Ada Anaokulu",
      slug: "yeni-ada-anaokulu",
      primaryType: InstitutionType.Kindergarten,
      location: {
        cityId: "city_ist",
        districtId: "dist_kadikoy",
        address: "İstanbul adres",
      },
      shortDescription: "İçe aktarım adayı.",
      qualityScore: 20,
      ...timestamps,
    }),
  );

  await repo.save(
    createPublishedInstitution({
      id: "inst_verified",
      name: "Doğrulanmış Dershane",
      slug: "dogrulanmis-dershane",
      primaryType: InstitutionType.Dershane,
      verification: InstitutionVerification.Verified,
      location: {
        cityId: "city_ank",
        districtId: "dist_cankaya",
        address: "Ankara adres",
        latitude: 39.9,
        longitude: 32.8,
      },
      contact: { phone: "+90 312 000 00 00" },
      socialLinks: { websiteUrl: "https://example.com" },
      programsSummary: "YKS hazırlık",
      shortDescription: "Doğrulanmış kurum.",
      qualityScore: 90,
      publishedAt: "2026-07-14T11:00:00.000Z",
      ...timestamps,
    }),
  );

  await repo.save(
    createDraftInstitution({
      id: "inst_dup_a",
      name: "Güneş Etüt",
      slug: "gunes-etut-a",
      primaryType: InstitutionType.EtutMerkezi,
      verification: InstitutionVerification.Pending,
      status: InstitutionStatus.PendingReview,
      location: {
        cityId: "city_ist",
        districtId: "dist_besiktas",
        address: "Beşiktaş A",
      },
      shortDescription: "Aday A.",
      qualityScore: 55,
      ...timestamps,
    }),
  );

  await repo.save(
    createPublishedInstitution({
      id: "inst_dup_b",
      name: "Gunes Etut",
      slug: "gunes-etut-b",
      primaryType: InstitutionType.EtutMerkezi,
      verification: InstitutionVerification.Unclaimed,
      location: {
        cityId: "city_ist",
        districtId: "dist_uskudar",
        address: "Üsküdar B",
      },
      shortDescription: "Aday B.",
      qualityScore: 45,
      publishedAt: "2026-07-14T11:00:00.000Z",
      ...timestamps,
    }),
  );
}

describe("buildInstitutionQualityIndicators", () => {
  it("flags missing acquisition fields", () => {
    const institution = createDraftInstitution({
      id: "inst_sparse",
      name: "Eksik Profil",
      slug: "eksik-profil",
      primaryType: InstitutionType.Kindergarten,
      location: {
        cityId: "city_ist",
        districtId: "dist_kadikoy",
        address: "Adres",
      },
      shortDescription: "Kısa açıklama zorunlu.",
      ...timestamps,
    });

    const indicators = buildInstitutionQualityIndicators(institution);
    expect(indicators.missingPhone).toBe(true);
    expect(indicators.missingWebsite).toBe(true);
    expect(indicators.missingCoordinates).toBe(true);
    expect(indicators.missingCategories).toBe(true);
    expect(indicators.missingCount).toBeGreaterThanOrEqual(4);
  });

  it("does not flag maps URL or educationPrograms as missing", () => {
    const institution = createDraftInstitution({
      id: "inst_owner_ready",
      name: "Tam Profil",
      slug: "tam-profil",
      primaryType: InstitutionType.PrivateSchool,
      location: {
        cityId: "city_ist",
        districtId: "dist_avcilar",
        address: "Adres",
        googleMapsUrl: "https://maps.app.goo.gl/example",
      },
      contact: { phone: "+90 212 000 00 00" },
      socialLinks: { websiteUrl: "https://example.com" },
      shortDescription: "Kısa açıklama zorunlu.",
      educationPrograms: ["lgs"],
      ...timestamps,
    });

    const indicators = buildInstitutionQualityIndicators(institution);
    expect(indicators.missingCoordinates).toBe(false);
    expect(indicators.missingCategories).toBe(false);
  });
});

describe("getInstitutionAcquisitionDashboard", () => {
  it("keeps stats but lists no rows without filters on queue=all", async () => {
    const repo = new InMemoryInstitutionRepository();
    await seedRepo(repo);

    const dashboard = await getInstitutionAcquisitionDashboard(
      { queue: "all", now: "2026-07-15T12:00:00.000Z", cityIdsForCounts: ["city_ist", "city_ank"] },
      {
        institutionRepository: repo,
        resolveCityLabel: (cityId) => (cityId === "city_ist" ? "İstanbul" : "Ankara"),
        resolveTypeLabel: (type) => type,
      },
    );

    expect(repo.listCalls).toHaveLength(0);
    expect(dashboard.rows).toHaveLength(0);
    expect(dashboard.matchedCount).toBe(0);
    expect(dashboard.searchNotice).toBeTruthy();
    expect(dashboard.usedCatalogScan).toBe(false);
    expect(dashboard.statistics.totalInstitutions).toBe(4);
    expect(dashboard.statistics.queueCounts.import).toBe(1);
    expect(dashboard.statistics.queueCounts.verified).toBe(1);
    expect(dashboard.statistics.claimRatePercent).toBeGreaterThan(0);
    expect(dashboard.statistics.byType.length).toBeGreaterThan(0);
    expect(repo.listAdminCalls.every((call) => call.pageSize !== 50)).toBe(true);
  });

  it("lists rows when a structured filter is present", async () => {
    const repo = new InMemoryInstitutionRepository();
    await seedRepo(repo);

    const dashboard = await getInstitutionAcquisitionDashboard(
      {
        queue: "all",
        cityId: "city_ist",
        pageSize: 50,
        now: "2026-07-15T12:00:00.000Z",
      },
      { institutionRepository: repo },
    );

    expect(dashboard.rows.length).toBeGreaterThan(0);
    expect(dashboard.searchNotice).toBeFalsy();
    expect(repo.listAdminCalls.some((call) => call.pageSize === 50)).toBe(true);
  });

  it("applies city/district/type filters before limit on bounded path", async () => {
    const repo = new InMemoryInstitutionRepository();
    await seedRepo(repo);

    await getInstitutionAcquisitionDashboard(
      {
        queue: "all",
        cityId: "city_ist",
        districtId: "dist_kadikoy",
        primaryType: InstitutionType.Kindergarten,
        pageSize: 50,
      },
      { institutionRepository: repo },
    );

    expect(repo.listCalls).toHaveLength(0);
    const tableCall = repo.listAdminCalls.find((call) => call.pageSize === 50);
    expect(tableCall?.filters).toMatchObject({
      cityId: "city_ist",
      districtId: "dist_kadikoy",
      primaryType: InstitutionType.Kindergarten,
    });
  });

  it("isolates catalog scan for duplicates queue and does not page-limit duplicates", async () => {
    const repo = new InMemoryInstitutionRepository();
    await seedRepo(repo);

    const duplicates = await getInstitutionAcquisitionDashboard(
      { queue: "duplicates" },
      { institutionRepository: repo },
    );

    expect(repo.listCalls.length).toBeGreaterThan(0);
    expect(duplicates.usedCatalogScan).toBe(true);
    expect(duplicates.rows).toHaveLength(2);
    expect(duplicates.duplicateCandidates.length).toBe(1);
    expect(duplicates.duplicateCandidates[0]?.count).toBe(2);
  });

  it("cost regression: unscoped free-text q never calls list() / listAll", async () => {
    const repo = new InMemoryInstitutionRepository();
    await seedRepo(repo);
    const listSpy = vi.spyOn(repo, "list");

    const dashboard = await getInstitutionAcquisitionDashboard(
      { queue: "all", query: "kolej" },
      { institutionRepository: repo },
    );

    expect(dashboard.locationRequired).toBe(true);
    expect(dashboard.searchNotice).toBeTruthy();
    expect(dashboard.rows).toHaveLength(0);
    expect(dashboard.usedCatalogScan).toBe(false);
    expect(listSpy).not.toHaveBeenCalled();
    expect(repo.listCalls).toHaveLength(0);
  });

  it("scoped free-text q uses list() and never requires location", async () => {
    const repo = new InMemoryInstitutionRepository();
    await seedRepo(repo);

    const byCity = await getInstitutionAcquisitionDashboard(
      { queue: "all", query: "etut", cityId: "city_ist" },
      { institutionRepository: repo },
    );
    expect(byCity.locationRequired).toBeFalsy();
    expect(repo.listCalls.length).toBeGreaterThan(0);
    expect(byCity.usedCatalogScan).toBe(true);

    repo.listCalls.length = 0;
    await getInstitutionAcquisitionDashboard(
      {
        queue: "all",
        query: "etut",
        cityId: "city_ist",
        districtId: "dist_kadikoy",
      },
      { institutionRepository: repo },
    );
    expect(repo.listCalls.length).toBeGreaterThan(0);

    repo.listCalls.length = 0;
    await getInstitutionAcquisitionDashboard(
      { queue: "all", query: "etut", primaryType: InstitutionType.EtutMerkezi },
      { institutionRepository: repo },
    );
    expect(repo.listCalls.length).toBeGreaterThan(0);
  });

  it("uses catalog scan for missing_fields sort without free-text", async () => {
    const repo = new InMemoryInstitutionRepository();
    await seedRepo(repo);

    await getInstitutionAcquisitionDashboard(
      { queue: "all", sort: "missing_fields" },
      { institutionRepository: repo },
    );
    expect(repo.listCalls.length).toBeGreaterThan(0);
  });

  it("paginates matched rows with bounded listAdminPage", async () => {
    const repo = new InMemoryInstitutionRepository();
    for (let index = 0; index < 5; index += 1) {
      await repo.save(
        createDraftInstitution({
          id: `inst_page_${index}`,
          name: `Sayfa Kurum ${index}`,
          slug: `sayfa-kurum-${index}`,
          primaryType: InstitutionType.Kindergarten,
          location: {
            cityId: "city_ist",
            districtId: "dist_kadikoy",
            address: "Adres",
          },
          shortDescription: "Sayfalama testi.",
          qualityScore: 50 + index,
          ...timestamps,
        }),
      );
    }

    const firstPage = await getInstitutionAcquisitionDashboard(
      { queue: "all", cityId: "city_ist", page: 1, pageSize: 2 },
      { institutionRepository: repo },
    );
    expect(firstPage.matchedCount).toBe(5);
    expect(firstPage.rows).toHaveLength(2);
    expect(firstPage.pagination).toMatchObject({
      page: 1,
      pageSize: 2,
      totalPages: 3,
      totalItems: 5,
      from: 1,
      to: 2,
    });
    expect(firstPage.nextCursor).toBeTruthy();
    expect(repo.listCalls).toHaveLength(0);

    const secondPage = await getInstitutionAcquisitionDashboard(
      {
        queue: "all",
        cityId: "city_ist",
        page: 2,
        pageSize: 2,
        cursor: firstPage.nextCursor,
      },
      { institutionRepository: repo },
    );
    expect(secondPage.matchedCount).toBe(5);
    expect(secondPage.rows).toHaveLength(2);
  });

  it("lightweight mode skips table listAdminPage and catalog scan", async () => {
    const repo = new InMemoryInstitutionRepository();
    await seedRepo(repo);

    const dashboard = await getInstitutionAcquisitionDashboard(
      { queue: "all", lightweight: true },
      { institutionRepository: repo },
    );

    expect(repo.listCalls).toHaveLength(0);
    expect(dashboard.rows).toHaveLength(0);
    expect(dashboard.usedCatalogScan).toBe(false);
    expect(dashboard.statistics.totalInstitutions).toBe(4);
    expect(repo.listAdminCalls.every((call) => call.pageSize !== 50)).toBe(true);
  });

  it("cost regression: unfiltered acquisition never lists the table or list(50_000)", async () => {
    const repo = new InMemoryInstitutionRepository();
    await seedRepo(repo);

    await getInstitutionAcquisitionDashboard(
      { queue: "all", pageSize: 50 },
      { institutionRepository: repo },
    );

    expect(
      repo.listCalls.some(
        (call) =>
          typeof call === "object" &&
          call !== null &&
          "pageSize" in call &&
          (call as { pageSize?: number }).pageSize === 50_000,
      ),
    ).toBe(false);
    expect(repo.listCalls).toHaveLength(0);
    expect(repo.listAdminCalls.some((call) => call.pageSize === 50)).toBe(false);
  });

  it("quality distribution uses stored score bands without page-limiting counts", async () => {
    const repo = new InMemoryInstitutionRepository();
    await seedRepo(repo);

    const dashboard = await getInstitutionAcquisitionDashboard(
      { queue: "import", pageSize: 1 },
      { institutionRepository: repo },
    );

    expect(dashboard.rows.length).toBeGreaterThanOrEqual(1);
    const distributionTotal =
      dashboard.statistics.qualityDistribution.low +
      dashboard.statistics.qualityDistribution.medium +
      dashboard.statistics.qualityDistribution.healthy +
      dashboard.statistics.qualityDistribution.excellent;
    expect(distributionTotal).toBe(4);
    expect(dashboard.statistics.byType.reduce((sum, item) => sum + item.count, 0)).toBe(4);
  });
});
