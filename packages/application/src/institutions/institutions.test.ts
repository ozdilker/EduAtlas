import {
  createPublishedInstitution,
  createPublishedSearchDocument,
  type Institution,
  type InstitutionId,
  InstitutionStatus,
  InstitutionType,
  InstitutionVerification,
  institutionIdAsString,
} from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import {
  createInstitutionFilters,
  createInstitutionPage,
  createInstitutionSearchQuery,
  createInstitutionSearchResult,
  DuplicateInstitutionError,
  InstitutionNotFoundError,
  type InstitutionRepository,
  type InstitutionSearchRepository,
  InstitutionSort,
  isDuplicateInstitutionError,
  isInstitutionNotFoundError,
  parseInstitutionSort,
} from "./index";

const timestamps = {
  createdAt: "2026-07-14T10:00:00.000Z",
  updatedAt: "2026-07-14T12:00:00.000Z",
  publishedAt: "2026-07-14T11:00:00.000Z",
};

function buildInstitution(
  overrides?: Partial<{ id: string; slug: string; name: string }>,
): Institution {
  return createPublishedInstitution({
    id: overrides?.id ?? "inst_1",
    name: overrides?.name ?? "Örnek Anaokulu",
    slug: overrides?.slug ?? "ornek-anaokulu",
    primaryType: InstitutionType.Kindergarten,
    verification: InstitutionVerification.Verified,
    location: {
      cityId: "city_ist",
      districtId: "dist_kadikoy",
      address: "Caferağa Mah. Örnek Sok. No:1",
    },
    contact: { email: "info@example.com" },
    shortDescription: "Statik örnek kurum.",
    ...timestamps,
  });
}

/**
 * In-memory fake proving the repository contracts are implementable without Firebase.
 */
class InMemoryInstitutionRepository implements InstitutionRepository {
  private readonly byId = new Map<string, Institution>();

  async getById(id: InstitutionId): Promise<Institution | null> {
    return this.byId.get(institutionIdAsString(id)) ?? null;
  }

  async getBySlug(slug: string): Promise<Institution | null> {
    return [...this.byId.values()].find((item) => item.slug === slug) ?? null;
  }

  async list() {
    const items = [...this.byId.values()];
    return createInstitutionPage({
      items,
      page: 1,
      pageSize: Math.max(items.length, 1),
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
    const slugOwner = await this.getBySlug(institution.slug);
    if (slugOwner && institutionIdAsString(slugOwner.id) !== id) {
      throw new DuplicateInstitutionError({ slug: institution.slug });
    }
    this.byId.set(id, institution);
    return institution;
  }

  async delete(id: InstitutionId): Promise<void> {
    const key = institutionIdAsString(id);
    if (!this.byId.has(key)) {
      throw new InstitutionNotFoundError({ id });
    }
    this.byId.delete(key);
  }
}

class InMemoryInstitutionSearchRepository implements InstitutionSearchRepository {
  constructor(private readonly documents: Institution[] = []) {}

  async search(query: ReturnType<typeof createInstitutionSearchQuery>) {
    const docs = this.documents
      .filter((item) => item.status === InstitutionStatus.Published)
      .filter((item) =>
        query.text
          ? item.name.toLocaleLowerCase("tr-TR").includes(query.text.toLocaleLowerCase("tr-TR"))
          : true,
      )
      .map((item) =>
        createPublishedSearchDocument({
          id: institutionIdAsString(item.id),
          slug: item.slug,
          name: item.name,
          primaryType: item.primaryType,
          cityId: item.location.cityId,
          citySlug: "istanbul",
          cityName: "İstanbul",
          districtId: item.location.districtId,
          districtSlug: "kadikoy",
          districtName: "Kadıköy",
          verification: item.verification,
          isPremium: item.isPremium,
          qualityScore: item.qualityScore,
          updatedAt: item.updatedAt,
        }),
      );

    return createInstitutionSearchResult({
      query,
      items: docs,
      totalItems: docs.length,
    });
  }
}

describe("institution application contracts", () => {
  it("creates immutable filters, query, page, and result models", () => {
    const filters = createInstitutionFilters({
      cityId: "city_ist",
      districtId: "dist_kadikoy",
      primaryType: InstitutionType.Kindergarten,
      status: InstitutionStatus.Published,
    });
    const query = createInstitutionSearchQuery({
      text: "anaokulu",
      filters,
      sort: InstitutionSort.Relevance,
      page: 1,
      pageSize: 12,
    });
    const page = createInstitutionPage({
      items: ["a", "b"],
      page: 1,
      pageSize: 12,
      totalItems: 2,
    });

    expect(Object.isFrozen(filters)).toBe(true);
    expect(Object.isFrozen(query)).toBe(true);
    expect(Object.isFrozen(page)).toBe(true);
    expect(page.totalPages).toBe(1);
    expect(parseInstitutionSort("name")).toBe(InstitutionSort.NameAsc);
  });

  it("rejects district filters without city", () => {
    expect(() => createInstitutionFilters({ districtId: "dist_only" })).toThrow(/cityId/);
  });

  it("implements InstitutionRepository without Firebase", async () => {
    const repo: InstitutionRepository = new InMemoryInstitutionRepository();
    const institution = buildInstitution();

    await repo.save(institution);
    await expect(repo.save(institution)).rejects.toBeInstanceOf(DuplicateInstitutionError);

    const loaded = await repo.getBySlug("ornek-anaokulu");
    expect(loaded?.name).toBe("Örnek Anaokulu");

    const listed = await repo.list();
    expect(listed.totalItems).toBe(1);

    await repo.delete(institution.id);
    expect(await repo.getById(institution.id)).toBeNull();

    await expect(repo.update(institution)).rejects.toSatisfy(isInstitutionNotFoundError);
  });

  it("implements InstitutionSearchRepository.search without Firebase", async () => {
    const searchRepo: InstitutionSearchRepository = new InMemoryInstitutionSearchRepository([
      buildInstitution(),
      buildInstitution({ id: "inst_2", slug: "baska-okul", name: "Başka Okul" }),
    ]);

    const result = await searchRepo.search(
      createInstitutionSearchQuery({ text: "örnek", page: 1, pageSize: 12 }),
    );

    expect(result.page.items).toHaveLength(1);
    expect(result.page.items[0]?.slug).toBe("ornek-anaokulu");
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("exposes typed repository errors", () => {
    const notFound = new InstitutionNotFoundError({ slug: "missing" });
    const duplicate = new DuplicateInstitutionError({ id: "inst_1", slug: "ornek-anaokulu" });

    expect(isInstitutionNotFoundError(notFound)).toBe(true);
    expect(isDuplicateInstitutionError(duplicate)).toBe(true);
    expect(notFound.code).toBe("INSTITUTION_NOT_FOUND");
    expect(duplicate.code).toBe("DUPLICATE_INSTITUTION");
  });
});
