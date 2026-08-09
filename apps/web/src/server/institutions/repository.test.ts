import type {
  InstitutionAdminListFilters,
  InstitutionAdminListPage,
  InstitutionAdminListPageInput,
  InstitutionListOptions,
  InstitutionPage,
  InstitutionRepository,
  InstitutionSearchQuery,
  InstitutionSearchRepository,
  InstitutionSearchResult,
} from "@eduatlas/application";
import {
  createInstitutionPage,
  createInstitutionSearchQuery,
  createInstitutionSearchResult,
} from "@eduatlas/application";
import { type Institution, type InstitutionId, InstitutionStatus } from "@eduatlas/domain";
import { describe, expect, it, vi } from "vitest";
import { createFallbackInstitutionDataAccess } from "./repository";

function emptyPage(): InstitutionPage<Institution> {
  return createInstitutionPage({
    items: [],
    page: 1,
    pageSize: 12,
    totalItems: 0,
  });
}

type ListAdminPageFn = NonNullable<InstitutionRepository["listAdminPage"]>;
type CountAdminFn = NonNullable<InstitutionRepository["countAdmin"]>;

function createStubPrimary(overrides?: {
  listAdminPage?: ListAdminPageFn;
  countAdmin?: CountAdminFn;
}): InstitutionRepository & InstitutionSearchRepository {
  const listAdminPage: ListAdminPageFn =
    overrides?.listAdminPage ??
    (async (_input: InstitutionAdminListPageInput): Promise<InstitutionAdminListPage> =>
      Object.freeze({
        items: Object.freeze([]),
        pageSize: 50,
        nextCursor: null,
        hasNextPage: false,
        totalItems: 0,
      }));
  const countAdmin: CountAdminFn =
    overrides?.countAdmin ?? (async (_filters?: InstitutionAdminListFilters): Promise<number> => 0);

  const listAdminPageSpy = vi.fn(listAdminPage);
  const countAdminSpy = vi.fn(countAdmin);

  return {
    getById: vi.fn(async (_id: InstitutionId) => null),
    getBySlug: vi.fn(async (_slug: string) => null),
    list: vi.fn(async (_options?: InstitutionListOptions) => emptyPage()),
    listAdminPage: listAdminPageSpy,
    countAdmin: countAdminSpy,
    save: vi.fn(async (institution: Institution) => institution),
    update: vi.fn(async (institution: Institution) => institution),
    delete: vi.fn(async (_id: InstitutionId) => undefined),
    search: vi.fn(
      async (query: InstitutionSearchQuery): Promise<InstitutionSearchResult> =>
        createInstitutionSearchResult({
          query,
          items: [],
          totalItems: 0,
        }),
    ),
  };
}

describe("createFallbackInstitutionDataAccess admin forwarding", () => {
  it("exposes listAdminPage and forwards arguments unchanged", async () => {
    const listAdminPageImpl: ListAdminPageFn = async () =>
      Object.freeze({
        items: Object.freeze([]),
        pageSize: 50,
        nextCursor: "cursor-next",
        hasNextPage: true,
        totalItems: 120,
      });
    const primary = createStubPrimary({ listAdminPage: listAdminPageImpl });
    const wrapped = createFallbackInstitutionDataAccess(primary, async () => primary);

    expect(typeof wrapped.listAdminPage).toBe("function");

    const input: InstitutionAdminListPageInput = {
      pageSize: 50,
      sort: "name_asc",
      cursor: "cursor-1",
      filters: {
        status: InstitutionStatus.Published,
        cityId: "city_ist",
      },
    };
    const result = await wrapped.listAdminPage?.(input);

    expect(primary.listAdminPage).toHaveBeenCalledTimes(1);
    expect(primary.listAdminPage).toHaveBeenCalledWith(input);
    expect(result?.totalItems).toBe(120);
    expect(result?.nextCursor).toBe("cursor-next");
  });

  it("exposes countAdmin and forwards arguments unchanged", async () => {
    const countAdminImpl: CountAdminFn = async () => 37406;
    const primary = createStubPrimary({ countAdmin: countAdminImpl });
    const wrapped = createFallbackInstitutionDataAccess(primary, async () => primary);

    expect(typeof wrapped.countAdmin).toBe("function");

    const filters: InstitutionAdminListFilters = {
      status: InstitutionStatus.Draft,
      cityId: "city_ank",
    };
    const total = await wrapped.countAdmin?.(filters);

    expect(primary.countAdmin).toHaveBeenCalledTimes(1);
    expect(primary.countAdmin).toHaveBeenCalledWith(filters);
    expect(total).toBe(37406);
  });

  it("keeps list() and search() available alongside admin methods", async () => {
    const primary = createStubPrimary();
    const wrapped = createFallbackInstitutionDataAccess(primary, async () => primary);

    await wrapped.listAdminPage?.({ pageSize: 50, sort: "name_asc" });
    await wrapped.countAdmin?.({ status: InstitutionStatus.Published });
    await wrapped.list({ page: 1, pageSize: 12 });
    await wrapped.search(createInstitutionSearchQuery({ text: "anaokulu" }));

    expect(primary.list).toHaveBeenCalledWith({ page: 1, pageSize: 12 });
    expect(primary.search).toHaveBeenCalled();
    expect(primary.listAdminPage).toHaveBeenCalled();
    expect(primary.countAdmin).toHaveBeenCalled();
  });
});
