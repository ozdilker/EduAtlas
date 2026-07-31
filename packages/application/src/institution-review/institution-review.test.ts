import {
  createDraftInstitution,
  createPublishedInstitution,
  type Institution,
  type InstitutionId,
  InstitutionStatus,
  institutionIdAsString,
} from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import {
  createInstitutionPage,
  DuplicateInstitutionError,
  InstitutionNotFoundError,
  type InstitutionRepository,
} from "../institutions";
import { getInstitutionReviewQueue } from "./get-institution-review-queue";
import { isReviewValidationError, reviewInstitution } from "./review-institution";

const NOW = "2026-07-15T12:00:00.000Z";

class InMemoryInstitutionRepository implements InstitutionRepository {
  private readonly byId = new Map<string, Institution>();

  constructor(seed: readonly Institution[] = []) {
    for (const institution of seed) {
      this.byId.set(institutionIdAsString(institution.id), institution);
    }
  }

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
    if (this.byId.has(id)) {
      throw new DuplicateInstitutionError({ id });
    }
    this.byId.set(id, institution);
    return institution;
  }

  async update(institution: Institution): Promise<Institution> {
    const id = institutionIdAsString(institution.id);
    if (!this.byId.has(id)) {
      throw new InstitutionNotFoundError({ id });
    }
    this.byId.set(id, institution);
    return institution;
  }

  async delete(id: InstitutionId): Promise<void> {
    this.byId.delete(institutionIdAsString(id));
  }
}

function draft(
  id: string,
  overrides: Partial<Parameters<typeof createDraftInstitution>[0]> = {},
): Institution {
  return createDraftInstitution({
    id,
    name: `Kurum ${id}`,
    slug: `kurum-${id}`,
    primaryType: "dershane",
    location: { cityId: "city_ankara", districtId: "dist_cankaya", address: "Adres 1" },
    contact: { phone: "+90 312 000 00 00" },
    shortDescription: "Kısa açıklama",
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  });
}

describe("getInstitutionReviewQueue", () => {
  it("buckets institutions into the five review queues", async () => {
    const repository = new InMemoryInstitutionRepository([
      draft("a"),
      draft("b", { status: InstitutionStatus.PendingReview }),
      createPublishedInstitution({
        id: "c",
        name: "Yayında Kurum",
        slug: "yayinda-kurum",
        primaryType: "kindergarten",
        location: { cityId: "city_istanbul", districtId: "dist_kadikoy", address: "Adres" },
        contact: { email: "a@b.com" },
        shortDescription: "Açıklama",
        publishedAt: NOW,
        createdAt: NOW,
        updatedAt: NOW,
      }),
      draft("d", { status: InstitutionStatus.Archived }),
    ]);

    const result = await getInstitutionReviewQueue(
      { queue: "draft", now: NOW },
      { institutionRepository: repository },
    );

    expect(result.queueCounts.draft).toBe(1);
    expect(result.queueCounts.needs_review).toBe(1);
    expect(result.queueCounts.published).toBe(1);
    expect(result.queueCounts.rejected).toBe(1);
    // draft "a" and pending "b" both pass publish gates (contact + address)
    expect(result.queueCounts.ready).toBe(2);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.institution.slug).toBe("kurum-a");
    expect(result.rows[0]?.publishValidation.ok).toBe(true);
    expect(result.rows[0]?.suggestedActions.length).toBeGreaterThan(0);
  });

  it("flags duplicates, filters by quality band, sorts by score", async () => {
    const repository = new InMemoryInstitutionRepository([
      draft("a", { name: "Aynı Kurum" }),
      draft("b", { name: "Aynı Kurum", slug: "kurum-b2" }),
      draft("c", {
        name: "Zengin Kurum",
        contact: { phone: "+90 312 1", email: "z@k.com" },
        longDescription:
          "Bu kurum çok uzun bir açıklamaya sahiptir ve içerik olarak oldukça zengindir. ".repeat(
            3,
          ),
        programsSummary: "Matematik, Fen",
        socialLinks: { websiteUrl: "https://zengin.example.com" },
      }),
    ]);

    const all = await getInstitutionReviewQueue(
      { queue: "draft", sort: "highest", now: NOW },
      { institutionRepository: repository },
    );

    expect(all.rows[0]?.institution.name).toBe("Zengin Kurum");
    const duplicateRow = all.rows.find((row) => row.institution.slug === "kurum-a");
    expect(duplicateRow?.isDuplicateCandidate).toBe(true);
    expect(duplicateRow?.duplicateNames).toContain("Aynı Kurum");

    const lowest = await getInstitutionReviewQueue(
      { queue: "draft", sort: "lowest", now: NOW },
      { institutionRepository: repository },
    );
    expect(lowest.rows[lowest.rows.length - 1]?.institution.name).toBe("Zengin Kurum");
  });

  it("returns the selected row for the review panel", async () => {
    const repository = new InMemoryInstitutionRepository([draft("a")]);
    const result = await getInstitutionReviewQueue(
      { selectedId: "a", now: NOW },
      { institutionRepository: repository },
    );
    expect(result.selected?.institution.slug).toBe("kurum-a");
    expect(result.selected?.quality.score).toBeGreaterThan(0);
  });
});

describe("reviewInstitution", () => {
  it("publishes a draft that passes the publish gates", async () => {
    const repository = new InMemoryInstitutionRepository([draft("a")]);

    const result = await reviewInstitution(
      { institutionId: "a", action: "publish", reviewedBy: "admin_demo", now: NOW },
      { institutionRepository: repository },
    );

    expect(result.institution.status).toBe(InstitutionStatus.Published);
    expect(result.institution.publishedAt).toBe(NOW);
    expect(result.institution.updatedByUserId).toBe("admin_demo");
  });

  it("refuses to publish when publish gates fail", async () => {
    const repository = new InMemoryInstitutionRepository([draft("a", { contact: {} })]);

    await expect(
      reviewInstitution(
        { institutionId: "a", action: "publish", now: NOW },
        { institutionRepository: repository },
      ),
    ).rejects.toSatisfy(isReviewValidationError);
  });

  it("returns to draft and rejects (archives)", async () => {
    const repository = new InMemoryInstitutionRepository([
      draft("a", { status: InstitutionStatus.PendingReview }),
    ]);

    const rejected = await reviewInstitution(
      { institutionId: "a", action: "reject", now: NOW },
      { institutionRepository: repository },
    );
    expect(rejected.institution.status).toBe(InstitutionStatus.Archived);

    const restored = await reviewInstitution(
      { institutionId: "a", action: "return_to_draft", now: NOW },
      { institutionRepository: repository },
    );
    expect(restored.institution.status).toBe(InstitutionStatus.Draft);
  });

  it("throws for unknown institutions and no-op transitions", async () => {
    const repository = new InMemoryInstitutionRepository([draft("a")]);

    await expect(
      reviewInstitution(
        { institutionId: "yok", action: "publish", now: NOW },
        { institutionRepository: repository },
      ),
    ).rejects.toThrow(/not found/i);

    await expect(
      reviewInstitution(
        { institutionId: "a", action: "return_to_draft", now: NOW },
        { institutionRepository: repository },
      ),
    ).rejects.toSatisfy(isReviewValidationError);
  });
});
