import {
  createDraftInstitution,
  createPublishedInstitution,
  type Institution,
  type InstitutionId,
  type InstitutionStatus,
  InstitutionType,
  institutionIdAsString,
} from "@eduatlas/domain";
import { describe, expect, it, vi } from "vitest";
import {
  createInstitutionPage,
  DuplicateInstitutionError,
  type InstitutionAdminListPage,
  type InstitutionAdminListPageInput,
  InstitutionNotFoundError,
  type InstitutionRepository,
} from "../institutions";
import { getInstitutionReviewQueue } from "./get-institution-review-queue";

const timestamps = {
  createdAt: "2026-07-14T10:00:00.000Z",
  updatedAt: "2026-07-14T12:00:00.000Z",
};

class StubAdminInstitutionRepository implements InstitutionRepository {
  readonly listCalls: unknown[] = [];
  readonly listAdminCalls: InstitutionAdminListPageInput[] = [];
  readonly countCalls: unknown[] = [];
  private readonly byId = new Map<string, Institution>();

  seed(institution: Institution) {
    this.byId.set(institutionIdAsString(institution.id), institution);
  }

  async getById(id: InstitutionId): Promise<Institution | null> {
    return this.byId.get(institutionIdAsString(id)) ?? null;
  }

  async getBySlug(slug: string): Promise<Institution | null> {
    return [...this.byId.values()].find((item) => item.slug === slug) ?? null;
  }

  async list(options?: { page?: number; pageSize?: number }) {
    this.listCalls.push(options);
    const items = [...this.byId.values()];
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? items.length;
    return createInstitutionPage({
      items: items.slice((page - 1) * pageSize, page * pageSize),
      page,
      pageSize,
      totalItems: items.length,
    });
  }

  async listAdminPage(input: InstitutionAdminListPageInput): Promise<InstitutionAdminListPage> {
    this.listAdminCalls.push(input);
    const status = input.filters?.status;
    const items = [...this.byId.values()]
      .filter((item) => !status || item.status === status)
      .slice(0, input.pageSize);
    return {
      items,
      pageSize: input.pageSize,
      nextCursor: null,
      hasNextPage: false,
      totalItems: items.length,
    };
  }

  async countAdmin(filters?: { status?: InstitutionStatus }): Promise<number> {
    this.countCalls.push(filters);
    return [...this.byId.values()].filter(
      (item) => !filters?.status || item.status === filters.status,
    ).length;
  }

  async save(institution: Institution): Promise<Institution> {
    const id = institutionIdAsString(institution.id);
    if (this.byId.has(id)) {
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

describe("getInstitutionReviewQueue bounded admin path", () => {
  it("uses countAdmin + listAdminPage and does not call list() without text search", async () => {
    const repo = new StubAdminInstitutionRepository();
    repo.seed(
      createDraftInstitution({
        id: "draft_1",
        name: "Taslak Okul",
        slug: "taslak-okul",
        primaryType: InstitutionType.Kindergarten,
        location: {
          cityId: "city_ist",
          districtId: "dist_kadikoy",
          address: "Adres",
        },
        shortDescription: "Kısa açıklama zorunlu.",
        ...timestamps,
      }),
    );
    repo.seed(
      createPublishedInstitution({
        id: "pub_1",
        name: "Yayın Okul",
        slug: "yayin-okul",
        primaryType: InstitutionType.Kindergarten,
        location: {
          cityId: "city_ist",
          districtId: "dist_kadikoy",
          address: "Adres",
        },
        contact: { phone: "+90 216 000 00 00" },
        shortDescription: "Kısa açıklama zorunlu.",
        publishedAt: timestamps.updatedAt,
        ...timestamps,
      }),
    );

    const result = await getInstitutionReviewQueue(
      { queue: "draft", pageSize: 50 },
      { institutionRepository: repo },
    );

    expect(repo.listCalls).toHaveLength(0);
    expect(repo.countCalls.length).toBeGreaterThanOrEqual(4);
    expect(repo.listAdminCalls.length).toBeGreaterThan(0);
    expect(result.queueCounts.draft).toBe(1);
    expect(result.queueCounts.published).toBe(1);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.institution.slug).toBe("taslak-okul");
  });

  it("cost regression: unscoped free-text q never calls list()", async () => {
    const repo = new StubAdminInstitutionRepository();
    const listSpy = vi.spyOn(repo, "list");

    const result = await getInstitutionReviewQueue(
      { queue: "draft", query: "kolej", pageSize: 50 },
      { institutionRepository: repo },
    );

    expect(result.locationRequired).toBe(true);
    expect(result.searchNotice).toBeTruthy();
    expect(result.rows).toHaveLength(0);
    expect(listSpy).not.toHaveBeenCalled();
    expect(repo.listCalls).toHaveLength(0);
  });

  it("falls back to list() for scoped free-text query to preserve substring search", async () => {
    const repo = new StubAdminInstitutionRepository();
    const listSpy = vi.spyOn(repo, "list");

    await getInstitutionReviewQueue(
      { queue: "draft", query: "okul", cityId: "city_ist", pageSize: 50 },
      { institutionRepository: repo },
    );

    expect(listSpy).toHaveBeenCalled();
  });

  it("scoped free-text also works with district or type", async () => {
    const repo = new StubAdminInstitutionRepository();
    const listSpy = vi.spyOn(repo, "list");

    await getInstitutionReviewQueue(
      {
        queue: "draft",
        query: "okul",
        cityId: "city_ist",
        districtId: "dist_kadikoy",
        pageSize: 50,
      },
      { institutionRepository: repo },
    );
    expect(listSpy).toHaveBeenCalled();

    listSpy.mockClear();
    await getInstitutionReviewQueue(
      {
        queue: "draft",
        query: "okul",
        primaryType: InstitutionType.Kindergarten,
        pageSize: 50,
      },
      { institutionRepository: repo },
    );
    expect(listSpy).toHaveBeenCalled();
  });
});
