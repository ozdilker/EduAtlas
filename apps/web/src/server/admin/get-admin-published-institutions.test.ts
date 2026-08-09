import { InstitutionStatus } from "@eduatlas/domain";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listAdminPage = vi.fn();
const countAdmin = vi.fn();
const list = vi.fn();

vi.mock("../institutions/repository", () => ({
  getInstitutionRepository: async () => ({
    listAdminPage,
    countAdmin,
    list,
  }),
}));

vi.mock("@eduatlas/firebase/server", () => ({
  buildTurkeyGeographySeedCatalog: () => ({
    cities: [{ id: { value: "city_ist" }, nameTr: "İstanbul" }],
  }),
  resolveGeoLabels: () => ({ cityName: "İstanbul", districtName: "Kadıköy" }),
}));

vi.mock("../institutions/to-profile-view", () => ({
  getInstitutionTypeLabel: () => "Anaokulu",
}));

describe("getAdminPublishedInstitutionsView", () => {
  beforeEach(() => {
    listAdminPage.mockReset();
    countAdmin.mockReset();
    list.mockReset();
  });

  it("uses bounded listAdminPage + countAdmin and never list() without search query", async () => {
    const { getAdminPublishedInstitutionsView } = await import(
      "./get-admin-published-institutions"
    );

    listAdminPage.mockResolvedValue({
      items: [],
      pageSize: 50,
      nextCursor: null,
      hasNextPage: false,
      totalItems: 0,
    });
    countAdmin.mockResolvedValue(0);

    await getAdminPublishedInstitutionsView({});

    expect(listAdminPage).toHaveBeenCalledWith(
      expect.objectContaining({
        pageSize: 50,
        sort: "name_asc",
        filters: expect.objectContaining({ status: InstitutionStatus.Published }),
      }),
    );
    expect(countAdmin).toHaveBeenCalled();
    expect(list).not.toHaveBeenCalled();
  });

  it("passes city filter and cursor into listAdminPage", async () => {
    const { getAdminPublishedInstitutionsView } = await import(
      "./get-admin-published-institutions"
    );

    listAdminPage.mockResolvedValue({
      items: [],
      pageSize: 50,
      nextCursor: "next",
      hasNextPage: true,
      totalItems: 120,
    });
    countAdmin.mockResolvedValue(200);

    const view = await getAdminPublishedInstitutionsView({
      cityId: "city_ist",
      cursor: "cursor-1",
      page: "2",
    });

    expect(listAdminPage).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: "cursor-1",
        filters: {
          status: InstitutionStatus.Published,
          cityId: "city_ist",
        },
      }),
    );
    expect(view.filteredCount).toBe(120);
    expect(view.totalCount).toBe(200);
    expect(view.pagination.nextCursor).toBe("next");
    expect(list).not.toHaveBeenCalled();
  });

  it("cost regression: unscoped free-text q never calls list()", async () => {
    const { getAdminPublishedInstitutionsView } = await import(
      "./get-admin-published-institutions"
    );

    const view = await getAdminPublishedInstitutionsView({ q: "kolej" });

    expect(view.locationRequired).toBe(true);
    expect(view.emptyMessage).toContain("şehir");
    expect(view.rows).toHaveLength(0);
    expect(list).not.toHaveBeenCalled();
    expect(listAdminPage).not.toHaveBeenCalled();
  });

  it("scoped free-text q uses list() with city filter", async () => {
    const { getAdminPublishedInstitutionsView } = await import(
      "./get-admin-published-institutions"
    );

    list.mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 50,
      totalItems: 0,
      totalPages: 1,
    });
    countAdmin.mockResolvedValue(10);

    await getAdminPublishedInstitutionsView({ q: "kolej", cityId: "city_ist" });

    expect(list).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({
          query: "kolej",
          cityId: "city_ist",
          status: InstitutionStatus.Published,
        }),
      }),
    );
  });
});
