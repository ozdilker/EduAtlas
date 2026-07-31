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
import { describe, expect, it } from "vitest";
import {
  createInstitutionPage,
  DuplicateInstitutionError,
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

  async getById(id: InstitutionId): Promise<Institution | null> {
    return this.byId.get(institutionIdAsString(id)) ?? null;
  }

  async getBySlug(slug: string): Promise<Institution | null> {
    return [...this.byId.values()].find((item) => item.slug === slug) ?? null;
  }

  async list(options?: {
    page?: number;
    pageSize?: number;
  }) {
    const items = [...this.byId.values()];
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
  it("aggregates queues, stats, and duplicate candidates from the repository", async () => {
    const repo = new InMemoryInstitutionRepository();

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

    const dashboard = await getInstitutionAcquisitionDashboard(
      { queue: "all", now: "2026-07-15T12:00:00.000Z" },
      {
        institutionRepository: repo,
        resolveCityLabel: (cityId) => (cityId === "city_ist" ? "İstanbul" : "Ankara"),
        resolveTypeLabel: (type) => type,
      },
    );

    expect(dashboard.statistics.totalInstitutions).toBe(4);
    expect(dashboard.statistics.queueCounts.import).toBe(1);
    expect(dashboard.statistics.queueCounts.verified).toBe(1);
    expect(dashboard.statistics.queueCounts.pending).toBeGreaterThanOrEqual(1);
    expect(dashboard.statistics.claimRatePercent).toBeGreaterThan(0);
    expect(dashboard.statistics.verificationRatePercent).toBe(25);
    expect(dashboard.statistics.byCity[0]?.label).toBe("İstanbul");
    expect(dashboard.duplicateCandidates.length).toBe(1);
    expect(dashboard.duplicateCandidates[0]?.count).toBe(2);

    const importQueue = await getInstitutionAcquisitionDashboard(
      { queue: "import" },
      { institutionRepository: repo },
    );
    expect(importQueue.rows).toHaveLength(1);
    expect(importQueue.rows[0]?.institution.id.value).toBe("inst_import");
    expect(importQueue.rows[0]?.quality.score).toBeGreaterThanOrEqual(0);
    expect(importQueue.sort).toBe("highest");

    const lowest = await getInstitutionAcquisitionDashboard(
      { queue: "all", sort: "lowest" },
      { institutionRepository: repo },
    );
    expect(lowest.rows[0]?.quality.score).toBeLessThanOrEqual(
      lowest.rows[lowest.rows.length - 1]?.quality.score ?? 100,
    );

    const duplicates = await getInstitutionAcquisitionDashboard(
      { queue: "duplicates" },
      { institutionRepository: repo },
    );
    expect(duplicates.rows).toHaveLength(2);
    expect(dashboard.statistics.qualityDistribution.averageScore).toBeGreaterThanOrEqual(0);
    expect(dashboard.statistics.qualityDistribution.byGrade).toBeTruthy();
  });

  it("paginates matched rows and reports full filtered count", async () => {
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
          ...timestamps,
        }),
      );
    }

    const firstPage = await getInstitutionAcquisitionDashboard(
      { queue: "all", page: 1, pageSize: 2 },
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

    const secondPage = await getInstitutionAcquisitionDashboard(
      { queue: "all", page: 2, pageSize: 2 },
      { institutionRepository: repo },
    );
    expect(secondPage.matchedCount).toBe(5);
    expect(secondPage.rows).toHaveLength(2);
    expect(secondPage.pagination.from).toBe(3);
    expect(secondPage.pagination.to).toBe(4);
  });
});
