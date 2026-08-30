import {
  createInstitutionFilters,
  createInstitutionSearchQuery,
  DuplicateInstitutionError,
  InstitutionNotFoundError,
  type InstitutionRepository,
  type InstitutionSearchRepository,
  InstitutionSort,
} from "@eduatlas/application";
import {
  createInstitution,
  createPublishedInstitution,
  type Institution,
  InstitutionStatus,
  InstitutionType,
  InstitutionVerification,
  institutionIdAsString,
} from "@eduatlas/domain";
import { describe, expect, it, vi } from "vitest";
import { FirestoreInstitutionMapper } from "./firestore-institution-mapper";
import { FirestoreInstitutionRepository } from "./firestore-institution-repository";
import { InMemoryInstitutionDocumentStore } from "./in-memory-institution-document-store";

const timestamps = {
  createdAt: "2026-07-14T10:00:00.000Z",
  updatedAt: "2026-07-14T12:00:00.000Z",
  publishedAt: "2026-07-14T11:00:00.000Z",
};

function buildInstitution(
  overrides?: Partial<{
    id: string;
    slug: string;
    name: string;
    qualityScore: number;
    status: InstitutionStatus;
    cityId: string;
    districtId: string;
    primaryType: InstitutionType;
  }>,
): Institution {
  const base = {
    id: overrides?.id ?? "inst_1",
    name: overrides?.name ?? "Örnek Anaokulu",
    slug: overrides?.slug ?? "ornek-anaokulu",
    primaryType: overrides?.primaryType ?? InstitutionType.Kindergarten,
    verification: InstitutionVerification.Verified,
    location: {
      cityId: overrides?.cityId ?? "city_ist",
      districtId: overrides?.districtId ?? "dist_kadikoy",
      address: "Caferağa Mah. Örnek Sok. No:1",
      geohash: "sxk3",
    },
    contact: { email: "info@example.com", phone: "+90 216 000 00 00" },
    socialLinks: { websiteUrl: "https://example.com" },
    shortDescription: "Firestore repository contract örneği.",
    isPremium: true,
    qualityScore: overrides?.qualityScore ?? 80,
    ...timestamps,
  };

  if (overrides?.status && overrides.status !== InstitutionStatus.Published) {
    return createInstitution({
      ...base,
      status: overrides.status,
    });
  }

  return createPublishedInstitution(base);
}

describe("FirestoreInstitutionMapper", () => {
  it("round-trips domain ⇄ firestore without losing fields", () => {
    const institution = buildInstitution();
    const withProfile = createPublishedInstitution({
      id: "inst_1",
      name: "Örnek Anaokulu",
      slug: "ornek-anaokulu",
      primaryType: InstitutionType.Kindergarten,
      verification: InstitutionVerification.Verified,
      location: {
        cityId: "city_ist",
        districtId: "dist_kadikoy",
        address: "Caferağa Mah. Örnek Sok. No:1",
        geohash: "sxk3",
      },
      contact: { email: "info@example.com", phone: "+90 216 000 00 00" },
      socialLinks: { websiteUrl: "https://example.com" },
      shortDescription: "Firestore repository contract örneği.",
      longDescription: "Uzun açıklama alanı.",
      isPremium: true,
      qualityScore: 80,
      updatedByUserId: "owner_demo",
      ...timestamps,
    });
    const document = FirestoreInstitutionMapper.toFirestore(withProfile);

    expect(document.primaryTypeId).toBe(InstitutionType.Kindergarten);
    expect(document.lifecycleStatus).toBe(InstitutionStatus.Published);
    expect(document.claimStatus).toBe("claimed");
    expect(document.contactEmail).toBe("info@example.com");
    expect(document.websiteUrl).toBe("https://example.com/");
    expect(document.longDescription).toBe("Uzun açıklama alanı.");
    expect(document.updatedByUserId).toBe("owner_demo");
    expect(document.nameFolded).toBeTruthy();
    expect(document.searchKeywords.length).toBeGreaterThan(0);
    expect(document.searchKeywords).toEqual(["ornek", "anaokulu"]);
    expect(document.searchKeywords).not.toContain("mah");
    expect(document.searchKeywords).not.toContain("cad");
    expect(document.searchKeywords).not.toContain("sk");
    expect(document.searchKeywords).not.toContain("no");
    expect(document.searchKeywords).not.toContain("caferaga");

    const restored = FirestoreInstitutionMapper.toDomain(
      institutionIdAsString(institution.id),
      document,
    );

    expect(restored.name).toBe(withProfile.name);
    expect(restored.verification).toBe(InstitutionVerification.Verified);
    expect(restored.location.cityId).toBe("city_ist");
    expect(restored.contact.email).toBe("info@example.com");
    expect(restored.socialLinks.websiteUrl).toBe("https://example.com/");
    expect(restored.longDescription).toBe("Uzun açıklama alanı.");
    expect(restored.updatedByUserId).toBe("owner_demo");
  });

  it("maps legacy claimStatus claimed to verified", () => {
    const institution = buildInstitution();
    const document = FirestoreInstitutionMapper.toFirestore(institution);
    document.claimStatus = "claimed";

    const restored = FirestoreInstitutionMapper.toDomain("inst_1", document);
    expect(restored.verification).toBe(InstitutionVerification.Verified);
  });
});

describe("FirestoreInstitutionRepository contract", () => {
  function createRepo() {
    return new FirestoreInstitutionRepository({
      store: new InMemoryInstitutionDocumentStore(),
    });
  }

  it("satisfies InstitutionRepository CRUD contracts", async () => {
    const repo: InstitutionRepository = createRepo();
    const institution = buildInstitution();

    await repo.save(institution);
    await expect(repo.save(institution)).rejects.toBeInstanceOf(DuplicateInstitutionError);

    expect((await repo.getById(institution.id))?.slug).toBe("ornek-anaokulu");
    expect((await repo.getBySlug("ornek-anaokulu"))?.name).toBe("Örnek Anaokulu");

    const renamed = buildInstitution({ name: "Yeni Anaokulu" });
    await repo.update(renamed);
    expect((await repo.getById(institution.id))?.name).toBe("Yeni Anaokulu");

    const listed = await repo.list({
      filters: createInstitutionFilters({ cityId: "city_ist" }),
      sort: InstitutionSort.NameAsc,
      page: 1,
      pageSize: 12,
    });
    expect(listed.totalItems).toBe(1);

    await repo.delete(institution.id);
    expect((await repo.getById(institution.id))?.status).toBe(InstitutionStatus.Deleted);

    await expect(repo.update(buildInstitution({ id: "missing" }))).rejects.toBeInstanceOf(
      InstitutionNotFoundError,
    );
  });

  it("lists with filters and pagination", async () => {
    const repo = createRepo();
    await repo.save(
      buildInstitution({ id: "a", slug: "a-okul", name: "A Okul", qualityScore: 50 }),
    );
    await repo.save(
      buildInstitution({ id: "b", slug: "b-okul", name: "B Okul", qualityScore: 90 }),
    );

    const page = await repo.list({
      sort: InstitutionSort.Relevance,
      page: 1,
      pageSize: 1,
    });

    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.slug).toBe("b-okul");
    expect(page.totalItems).toBe(2);
    expect(page.totalPages).toBe(2);
  });

  it("empty-text search does not call listAll and applies city+type in Firestore filters", async () => {
    const store = new InMemoryInstitutionDocumentStore();
    const listAllSpy = vi.spyOn(store, "listAll");
    const browseSpy = vi.spyOn(store, "listPublishedBrowsePage");
    const repo = new FirestoreInstitutionRepository({ store });

    await repo.save(
      buildInstitution({
        id: "a",
        slug: "a-okul",
        name: "A Okul",
        qualityScore: 50,
      }),
    );
    await repo.save(
      buildInstitution({
        id: "b",
        slug: "b-okul",
        name: "B Okul",
        qualityScore: 90,
      }),
    );

    const result = await repo.search(
      createInstitutionSearchQuery({
        text: "",
        page: 1,
        pageSize: 12,
        filters: createInstitutionFilters({
          cityId: "city_ist",
          primaryType: InstitutionType.Kindergarten,
        }),
      }),
    );

    expect(listAllSpy).not.toHaveBeenCalled();
    expect(browseSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 12,
        cursor: null,
        filters: {
          cityId: "city_ist",
          primaryTypeId: InstitutionType.Kindergarten,
        },
      }),
    );
    expect(result.page.items.length).toBeGreaterThan(0);
    expect(result.nextCursor === null || typeof result.nextCursor === "string").toBe(true);
  });

  it("empty-text search paginates with published-browse cursor startAfter", async () => {
    const store = new InMemoryInstitutionDocumentStore();
    const browseSpy = vi.spyOn(store, "listPublishedBrowsePage");
    const repo = new FirestoreInstitutionRepository({ store });

    await repo.save(
      buildInstitution({ id: "a", slug: "a-okul", name: "A Okul", qualityScore: 50 }),
    );
    await repo.save(
      buildInstitution({ id: "b", slug: "b-okul", name: "B Okul", qualityScore: 90 }),
    );
    await repo.save(
      buildInstitution({ id: "c", slug: "c-okul", name: "C Okul", qualityScore: 70 }),
    );

    const first = await repo.search(
      createInstitutionSearchQuery({ text: "", page: 1, pageSize: 2 }),
    );
    expect(first.page.items).toHaveLength(2);
    expect(first.nextCursor).toBeTruthy();

    const second = await repo.search(
      createInstitutionSearchQuery({
        text: "",
        page: 2,
        pageSize: 2,
        cursor: first.nextCursor,
      }),
    );
    expect(browseSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        limit: 2,
        cursor: expect.objectContaining({ id: expect.any(String) }),
      }),
    );
    expect(second.page.items.length).toBeGreaterThan(0);
    expect(second.page.items[0]?.id).not.toBe(first.page.items[0]?.id);
  });

  it("unfiltered free-text search never uses listAll or city dump", async () => {
    const store = new InMemoryInstitutionDocumentStore();
    const listAllSpy = vi.spyOn(store, "listAll");
    const candidatesSpy = vi.spyOn(store, "listPublishedCandidates");
    const browseSpy = vi.spyOn(store, "listPublishedBrowsePage");
    const keywordSpy = vi.spyOn(store, "findBySearchKeyword");
    const repo = new FirestoreInstitutionRepository({ store });
    await repo.save(buildInstitution());

    await repo.search(createInstitutionSearchQuery({ text: "anaokulu", page: 1, pageSize: 12 }));

    expect(listAllSpy).not.toHaveBeenCalled();
    expect(candidatesSpy).not.toHaveBeenCalled();
    expect(browseSpy).not.toHaveBeenCalled();
    expect(keywordSpy).not.toHaveBeenCalled();
  });

  it("free-text + city uses keyword/exact probes and does not dump published candidates", async () => {
    const store = new InMemoryInstitutionDocumentStore();
    const listAllSpy = vi.spyOn(store, "listAll");
    const candidatesSpy = vi.spyOn(store, "listPublishedCandidates");
    const keywordSpy = vi.spyOn(store, "findBySearchKeyword");
    const exactSpy = vi.spyOn(store, "findByExactName");
    const repo = new FirestoreInstitutionRepository({ store });

    await repo.save(buildInstitution({ id: "a", slug: "a-anaokulu", name: "A Anaokulu" }));
    await repo.save(
      buildInstitution({
        id: "b",
        slug: "b-okul",
        name: "B Okul Ankara",
        // different city via save override — use second institution with same city for match
      }),
    );
    // Institution in another city
    const otherCity = createPublishedInstitution({
      id: "c",
      name: "C Anaokulu Izmir",
      slug: "c-anaokulu-izmir",
      primaryType: InstitutionType.Kindergarten,
      verification: InstitutionVerification.Verified,
      location: {
        cityId: "city_izmir",
        districtId: "dist_konak",
        address: "Izmir",
      },
      contact: { email: "c@example.com", phone: "+90 232 000 00 00" },
      shortDescription: "Izmir anaokulu.",
      qualityScore: 70,
      ...timestamps,
    });
    await repo.save(otherCity);

    const result = await repo.search(
      createInstitutionSearchQuery({
        text: "anaokulu",
        page: 1,
        pageSize: 12,
        filters: createInstitutionFilters({ cityId: "city_ist" }),
      }),
    );

    expect(listAllSpy).not.toHaveBeenCalled();
    expect(candidatesSpy).not.toHaveBeenCalled();
    expect(keywordSpy).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: "anaokulu", cityId: "city_ist", limit: 40 }),
    );
    expect(exactSpy).toHaveBeenCalled();
    expect(result.page.items.every((item) => item.cityId === "city_ist")).toBe(true);
    expect(result.page.items.some((item) => item.slug === "a-anaokulu")).toBe(true);
    expect(result.page.items.some((item) => item.slug === "c-anaokulu-izmir")).toBe(false);
  });

  it("free-text + district does not call listAll or city dump", async () => {
    const store = new InMemoryInstitutionDocumentStore();
    const listAllSpy = vi.spyOn(store, "listAll");
    const candidatesSpy = vi.spyOn(store, "listPublishedCandidates");
    const keywordSpy = vi.spyOn(store, "findBySearchKeyword");
    const repo = new FirestoreInstitutionRepository({ store });
    await repo.save(buildInstitution());

    await repo.search(
      createInstitutionSearchQuery({
        text: "anaokulu",
        filters: createInstitutionFilters({
          cityId: "city_ist",
          districtId: "dist_kadikoy",
        }),
      }),
    );

    expect(listAllSpy).not.toHaveBeenCalled();
    expect(candidatesSpy).not.toHaveBeenCalled();
    expect(keywordSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        keyword: "anaokulu",
        districtId: "dist_kadikoy",
        limit: 40,
      }),
    );
  });

  it("free-text + primaryType without city does not dump by type", async () => {
    const store = new InMemoryInstitutionDocumentStore();
    const listAllSpy = vi.spyOn(store, "listAll");
    const candidatesSpy = vi.spyOn(store, "listPublishedCandidates");
    const keywordSpy = vi.spyOn(store, "findBySearchKeyword");
    const repo = new FirestoreInstitutionRepository({ store });
    await repo.save(buildInstitution());

    await repo.search(
      createInstitutionSearchQuery({
        text: "anaokulu",
        filters: createInstitutionFilters({
          primaryType: InstitutionType.Kindergarten,
        }),
      }),
    );

    expect(listAllSpy).not.toHaveBeenCalled();
    expect(candidatesSpy).not.toHaveBeenCalled();
    expect(keywordSpy).not.toHaveBeenCalled();
  });

  it("free-text + city + type uses keyword probe not candidate dump", async () => {
    const store = new InMemoryInstitutionDocumentStore();
    const listAllSpy = vi.spyOn(store, "listAll");
    const candidatesSpy = vi.spyOn(store, "listPublishedCandidates");
    const keywordSpy = vi.spyOn(store, "findBySearchKeyword");
    const repo = new FirestoreInstitutionRepository({ store });
    await repo.save(buildInstitution());

    await repo.search(
      createInstitutionSearchQuery({
        text: "ornek",
        filters: createInstitutionFilters({
          cityId: "city_ist",
          primaryType: InstitutionType.Kindergarten,
        }),
      }),
    );

    expect(listAllSpy).not.toHaveBeenCalled();
    expect(candidatesSpy).not.toHaveBeenCalled();
    expect(keywordSpy).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: "ornek", cityId: "city_ist", limit: 40 }),
    );
  });

  it("free-text + city + district + type uses district keyword probe", async () => {
    const store = new InMemoryInstitutionDocumentStore();
    const listAllSpy = vi.spyOn(store, "listAll");
    const candidatesSpy = vi.spyOn(store, "listPublishedCandidates");
    const keywordSpy = vi.spyOn(store, "findBySearchKeyword");
    const repo = new FirestoreInstitutionRepository({ store });
    await repo.save(buildInstitution());

    await repo.search(
      createInstitutionSearchQuery({
        text: "anaokulu",
        filters: createInstitutionFilters({
          cityId: "city_ist",
          districtId: "dist_kadikoy",
          primaryType: InstitutionType.Kindergarten,
        }),
      }),
    );

    expect(listAllSpy).not.toHaveBeenCalled();
    expect(candidatesSpy).not.toHaveBeenCalled();
    expect(keywordSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        keyword: "anaokulu",
        districtId: "dist_kadikoy",
        limit: 40,
      }),
    );
  });

  it("scoped free-text preserves text scoring and excludes unpublished from candidates", async () => {
    const store = new InMemoryInstitutionDocumentStore();
    const candidatesSpy = vi.spyOn(store, "listPublishedCandidates");
    const repo = new FirestoreInstitutionRepository({ store });

    await repo.save(
      buildInstitution({
        id: "pub",
        slug: "pub-anaokulu",
        name: "Pub Anaokulu",
        qualityScore: 50,
      }),
    );
    await repo.save(
      buildInstitution({
        id: "draft",
        slug: "draft-anaokulu",
        name: "Draft Anaokulu",
        status: InstitutionStatus.Draft,
      }),
    );
    await repo.save(
      buildInstitution({
        id: "better",
        slug: "better-anaokulu",
        name: "Better Anaokulu",
        qualityScore: 90,
      }),
    );

    const result = await repo.search(
      createInstitutionSearchQuery({
        text: "anaokulu",
        page: 1,
        pageSize: 12,
        filters: createInstitutionFilters({ cityId: "city_ist" }),
      }),
    );

    expect(candidatesSpy).not.toHaveBeenCalled();
    expect(result.page.items.map((item) => item.slug)).not.toContain("draft-anaokulu");
    expect(result.page.items[0]?.slug).toBe("better-anaokulu");
    expect(result.page.pageSize).toBe(12);
    expect(result.page.page).toBe(1);
  });

  it("scoped free-text preserves Turkish folding matches", async () => {
    const store = new InMemoryInstitutionDocumentStore();
    const listAllSpy = vi.spyOn(store, "listAll");
    const repo = new FirestoreInstitutionRepository({ store });
    await repo.save(
      buildInstitution({
        id: "tr",
        slug: "sisli-anaokulu",
        name: "Şişli Anaokulu",
      }),
    );

    const result = await repo.search(
      createInstitutionSearchQuery({
        text: "sisli",
        filters: createInstitutionFilters({ cityId: "city_ist" }),
      }),
    );

    expect(listAllSpy).not.toHaveBeenCalled();
    expect(result.page.items[0]?.slug).toBe("sisli-anaokulu");
  });

  it("scoped free-text keyword recall is capped and never dumps the city catalog", async () => {
    const store = new InMemoryInstitutionDocumentStore();
    const candidatesSpy = vi.spyOn(store, "listPublishedCandidates");
    const keywordSpy = vi.spyOn(store, "findBySearchKeyword");
    const repo = new FirestoreInstitutionRepository({ store });

    for (let i = 0; i < 20; i += 1) {
      await repo.save(
        buildInstitution({
          id: `inst_${i}`,
          slug: `anaokulu-${i}`,
          name: `Anaokulu ${i}`,
          qualityScore: i,
        }),
      );
    }

    const result = await repo.search(
      createInstitutionSearchQuery({
        text: "anaokulu",
        page: 1,
        pageSize: 12,
        filters: createInstitutionFilters({ cityId: "city_ist" }),
      }),
    );

    expect(candidatesSpy).not.toHaveBeenCalled();
    expect(keywordSpy).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: "anaokulu", cityId: "city_ist", limit: 40 }),
    );
    expect(result.page.items).toHaveLength(12);
    expect(result.page.totalItems).toBe(20);
    expect(result.page.totalItems).toBeLessThanOrEqual(50);
  });

  it("listPublishedBrowsePage uses limited published query and cursor, never listAll", async () => {
    const store = new InMemoryInstitutionDocumentStore();
    const listAllSpy = vi.spyOn(store, "listAll");
    const browseSpy = vi.spyOn(store, "listPublishedBrowsePage");
    const repo = new FirestoreInstitutionRepository({ store });

    await repo.save(
      buildInstitution({ id: "a", slug: "a-okul", name: "A Okul", qualityScore: 50 }),
    );
    await repo.save(
      buildInstitution({ id: "b", slug: "b-okul", name: "B Okul", qualityScore: 90 }),
    );
    await repo.save(
      buildInstitution({ id: "c", slug: "c-okul", name: "C Okul", qualityScore: 70 }),
    );
    await repo.save(
      buildInstitution({
        id: "d",
        slug: "d-okul",
        name: "D Okul",
        qualityScore: 95,
        status: InstitutionStatus.Draft,
      }),
    );

    const first = await repo.listPublishedBrowsePage({ pageSize: 2 });
    expect(first.items).toHaveLength(2);
    expect(first.items.map((item) => item.slug)).toEqual(["b-okul", "c-okul"]);
    expect(first.totalPublished).toBe(3);
    expect(first.nextCursor).toBeTruthy();
    expect(listAllSpy).not.toHaveBeenCalled();
    expect(browseSpy).toHaveBeenCalledWith(expect.objectContaining({ limit: 2, cursor: null }));

    const second = await repo.listPublishedBrowsePage({
      pageSize: 2,
      cursor: first.nextCursor,
    });
    expect(second.items).toHaveLength(1);
    expect(second.items[0]?.slug).toBe("a-okul");
    expect(second.nextCursor).toBeNull();
    expect(browseSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        limit: 2,
        cursor: expect.objectContaining({ id: "c", qualityScore: 70 }),
      }),
    );
    expect(listAllSpy).not.toHaveBeenCalled();
  });

  it("listRelatedPublishedByCity returns at most limit published rows ordered by quality", async () => {
    const store = new InMemoryInstitutionDocumentStore();
    const listSpy = vi.spyOn(store, "listByCityId");
    const limitedSpy = vi.spyOn(store, "listPublishedByCityIdLimited");
    const repo = new FirestoreInstitutionRepository({ store });

    await repo.save(
      buildInstitution({ id: "a", slug: "a-okul", name: "A Okul", qualityScore: 50 }),
    );
    await repo.save(
      buildInstitution({ id: "b", slug: "b-okul", name: "B Okul", qualityScore: 90 }),
    );
    await repo.save(
      buildInstitution({
        id: "c",
        slug: "c-okul",
        name: "C Okul",
        qualityScore: 70,
        status: InstitutionStatus.Draft,
      }),
    );

    const related = await repo.listRelatedPublishedByCity("city_ist", 7);

    expect(related).toHaveLength(2);
    expect(related.map((item) => item.slug)).toEqual(["b-okul", "a-okul"]);
    expect(limitedSpy).toHaveBeenCalledWith("city_ist", 7);
    expect(listSpy).not.toHaveBeenCalled();
  });

  it("implements InstitutionSearchRepository keyword search for published institutions", async () => {
    const repo = createRepo();
    await repo.save(buildInstitution());
    await repo.save(
      buildInstitution({
        id: "inst_2",
        slug: "baska-okul",
        name: "Başka Okul",
        status: InstitutionStatus.Draft,
      }),
    );

    const searchRepo: InstitutionSearchRepository = repo;
    const result = await searchRepo.search(
      createInstitutionSearchQuery({
        text: "anaokulu",
        filters: createInstitutionFilters({ cityId: "city_ist" }),
      }),
    );
    expect(result.page.items).toHaveLength(1);
    expect(result.page.items[0]?.slug).toBe("ornek-anaokulu");
    expect(result.page.items[0]?.searchKeywords.length).toBeGreaterThan(0);

    const miss = await searchRepo.search(createInstitutionSearchQuery({ text: "xyz-yok" }));
    expect(miss.page.items).toEqual([]);
    expect(miss.page.totalItems).toBe(0);
  });

  it("listAdminPage pageSize=50 uses Firestore limit(50) and never listAll", async () => {
    const store = new InMemoryInstitutionDocumentStore();
    const listAllSpy = vi.spyOn(store, "listAll");
    const listByCitySpy = vi.spyOn(store, "listByCityId");
    const adminSpy = vi.spyOn(store, "listAdminPage");
    const countSpy = vi.spyOn(store, "countAdmin");
    const repo = new FirestoreInstitutionRepository({ store });

    for (let i = 0; i < 60; i += 1) {
      await repo.save(
        buildInstitution({
          id: `inst_${i}`,
          slug: `okul-${i}`,
          name: `Okul ${String(i).padStart(2, "0")}`,
        }),
      );
    }

    const page = await repo.listAdminPage({
      pageSize: 50,
      sort: "name_asc",
      filters: { status: InstitutionStatus.Published },
    });

    expect(page.items).toHaveLength(50);
    expect(page.totalItems).toBe(60);
    expect(page.hasNextPage).toBe(true);
    expect(page.nextCursor).toBeTruthy();
    expect(listAllSpy).not.toHaveBeenCalled();
    expect(listByCitySpy).not.toHaveBeenCalled();
    expect(adminSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 50,
        sort: "name_asc",
        cursor: null,
        filters: expect.objectContaining({ lifecycleStatus: "published" }),
      }),
    );
    expect(countSpy).toHaveBeenCalled();
  });

  it("listAdminPage page 2 uses startAfter cursor without duplicates or skips", async () => {
    const store = new InMemoryInstitutionDocumentStore();
    const listAllSpy = vi.spyOn(store, "listAll");
    const adminSpy = vi.spyOn(store, "listAdminPage");
    const repo = new FirestoreInstitutionRepository({ store });

    for (const name of ["A Okul", "B Okul", "C Okul", "D Okul", "E Okul"]) {
      const slug = name.toLowerCase().replace(" ", "-");
      await repo.save(
        buildInstitution({
          id: slug,
          slug,
          name,
        }),
      );
    }

    const first = await repo.listAdminPage({
      pageSize: 2,
      sort: "name_asc",
      filters: { status: InstitutionStatus.Published },
    });
    expect(first.items.map((item) => item.name)).toEqual(["A Okul", "B Okul"]);
    expect(first.nextCursor).toBeTruthy();

    const second = await repo.listAdminPage({
      pageSize: 2,
      sort: "name_asc",
      cursor: first.nextCursor,
      filters: { status: InstitutionStatus.Published },
    });
    expect(second.items.map((item) => item.name)).toEqual(["C Okul", "D Okul"]);

    const ids = [...first.items, ...second.items].map((item) => institutionIdAsString(item.id));
    expect(new Set(ids).size).toBe(4);
    expect(listAllSpy).not.toHaveBeenCalled();
    expect(adminSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        limit: 2,
        cursor: expect.objectContaining({ id: "b-okul", name: "B Okul" }),
      }),
    );
  });

  it("list() with unscoped free-text query never calls listAll()", async () => {
    const store = new InMemoryInstitutionDocumentStore();
    const listAllSpy = vi.spyOn(store, "listAll");
    const listByCitySpy = vi.spyOn(store, "listByCityId");
    const repo = new FirestoreInstitutionRepository({ store });

    await repo.save(buildInstitution({ id: "a", slug: "abc-koleji", name: "ABC Koleji" }));

    const page = await repo.list({
      filters: { query: "kolej" },
      page: 1,
      pageSize: 50,
    });

    expect(page.items).toHaveLength(0);
    expect(page.totalItems).toBe(0);
    expect(listAllSpy).not.toHaveBeenCalled();
    expect(listByCitySpy).not.toHaveBeenCalled();
  });

  it("list() with city-scoped free-text keeps name/slug substring matching", async () => {
    const store = new InMemoryInstitutionDocumentStore();
    const listAllSpy = vi.spyOn(store, "listAll");
    const listByCitySpy = vi.spyOn(store, "listByCityId");
    const repo = new FirestoreInstitutionRepository({ store });

    await repo.save(
      buildInstitution({
        id: "a",
        slug: "abc-koleji",
        name: "ABC Koleji",
        cityId: "city_ist",
      }),
    );
    await repo.save(
      buildInstitution({
        id: "b",
        slug: "diger",
        name: "Diğer Okul",
        cityId: "city_ist",
      }),
    );

    const page = await repo.list({
      filters: { query: "kolej", cityId: "city_ist" },
      page: 1,
      pageSize: 50,
    });

    expect(listAllSpy).not.toHaveBeenCalled();
    expect(listByCitySpy).toHaveBeenCalledWith("city_ist");
    expect(page.items.map((item) => item.slug)).toEqual(["abc-koleji"]);
  });

  it("listAdminPage city/district/type filters stay bounded (no unbounded gets)", async () => {
    const store = new InMemoryInstitutionDocumentStore();
    const listAllSpy = vi.spyOn(store, "listAll");
    const listByCitySpy = vi.spyOn(store, "listByCityId");
    const listByDistrictSpy = vi.spyOn(store, "listByDistrictId");
    const listByTypeSpy = vi.spyOn(store, "listByPrimaryType");
    const adminSpy = vi.spyOn(store, "listAdminPage");
    const repo = new FirestoreInstitutionRepository({ store });

    await repo.save(
      buildInstitution({
        id: "ist-1",
        slug: "ist-1",
        name: "İst 1",
        cityId: "city_ist",
        districtId: "dist_kadikoy",
      }),
    );
    await repo.save(
      buildInstitution({
        id: "ank-1",
        slug: "ank-1",
        name: "Ank 1",
        cityId: "city_ank",
        districtId: "dist_cankaya",
      }),
    );
    await repo.save(
      buildInstitution({
        id: "ist-lise",
        slug: "ist-lise",
        name: "İst Lise",
        cityId: "city_ist",
        districtId: "dist_kadikoy",
        primaryType: InstitutionType.PrivateSchool,
      }),
    );

    const byCity = await repo.listAdminPage({
      pageSize: 50,
      filters: { status: InstitutionStatus.Published, cityId: "city_ist" },
    });
    expect(byCity.items).toHaveLength(2);
    expect(byCity.totalItems).toBe(2);

    const byDistrict = await repo.listAdminPage({
      pageSize: 50,
      filters: {
        status: InstitutionStatus.Published,
        cityId: "city_ist",
        districtId: "dist_kadikoy",
      },
    });
    expect(byDistrict.items).toHaveLength(2);

    const byType = await repo.listAdminPage({
      pageSize: 50,
      filters: {
        status: InstitutionStatus.Published,
        primaryType: InstitutionType.PrivateSchool,
      },
    });
    expect(byType.items).toHaveLength(1);
    expect(byType.items[0]?.slug).toBe("ist-lise");

    expect(listAllSpy).not.toHaveBeenCalled();
    expect(listByCitySpy).not.toHaveBeenCalled();
    expect(listByDistrictSpy).not.toHaveBeenCalled();
    expect(listByTypeSpy).not.toHaveBeenCalled();
    expect(adminSpy).toHaveBeenCalled();
  });

  it("countAdmin uses aggregation path and never listAll", async () => {
    const store = new InMemoryInstitutionDocumentStore();
    const listAllSpy = vi.spyOn(store, "listAll");
    const countSpy = vi.spyOn(store, "countAdmin");
    const repo = new FirestoreInstitutionRepository({ store });

    await repo.save(buildInstitution({ id: "a", slug: "a-okul", name: "A Okul" }));
    await repo.save(
      buildInstitution({
        id: "b",
        slug: "b-okul",
        name: "B Okul",
        status: InstitutionStatus.Draft,
      }),
    );

    const published = await repo.countAdmin({ status: InstitutionStatus.Published });
    const allDraft = await repo.countAdmin({ status: InstitutionStatus.Draft });

    expect(published).toBe(1);
    expect(allDraft).toBe(1);
    expect(countSpy).toHaveBeenCalled();
    expect(listAllSpy).not.toHaveBeenCalled();
  });

  it("listAdminPage default name_asc sort matches NameAsc listing order", async () => {
    const store = new InMemoryInstitutionDocumentStore();
    const repo = new FirestoreInstitutionRepository({ store });

    await repo.save(buildInstitution({ id: "c", slug: "c-okul", name: "C Okul" }));
    await repo.save(buildInstitution({ id: "a", slug: "a-okul", name: "A Okul" }));
    await repo.save(buildInstitution({ id: "b", slug: "b-okul", name: "B Okul" }));

    const adminPage = await repo.listAdminPage({
      pageSize: 50,
      sort: "name_asc",
      filters: { status: InstitutionStatus.Published },
    });
    const legacy = await repo.list({
      page: 1,
      pageSize: 50,
      sort: InstitutionSort.NameAsc,
      filters: createInstitutionFilters({ status: InstitutionStatus.Published }),
    });

    expect(adminPage.items.map((item) => item.name)).toEqual(legacy.items.map((item) => item.name));
  });
});
