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
import { describe, expect, it } from "vitest";
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
  }>,
): Institution {
  const base = {
    id: overrides?.id ?? "inst_1",
    name: overrides?.name ?? "Örnek Anaokulu",
    slug: overrides?.slug ?? "ornek-anaokulu",
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
    const result = await searchRepo.search(createInstitutionSearchQuery({ text: "anaokulu" }));
    expect(result.page.items).toHaveLength(1);
    expect(result.page.items[0]?.slug).toBe("ornek-anaokulu");
    expect(result.page.items[0]?.searchKeywords.length).toBeGreaterThan(0);

    const miss = await searchRepo.search(createInstitutionSearchQuery({ text: "xyz-yok" }));
    expect(miss.page.items).toEqual([]);
    expect(miss.page.totalItems).toBe(0);
  });
});
