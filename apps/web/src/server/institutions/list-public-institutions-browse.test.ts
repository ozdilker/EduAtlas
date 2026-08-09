import { createSeededInstitutionRepository } from "@eduatlas/firebase/server";
import { describe, expect, it, vi } from "vitest";
import { listPublicInstitutionsBrowse } from "./list-public-institutions-browse";

describe("listPublicInstitutionsBrowse", () => {
  it("loads first page without listAll and keeps published browse shape", async () => {
    const repository = await createSeededInstitutionRepository();
    const listAllSpy = vi.spyOn(repository, "list");
    const searchSpy = "search" in repository ? vi.spyOn(repository as never, "search") : null;
    const browseSpy = vi.spyOn(repository, "listPublishedBrowsePage");

    const view = await listPublicInstitutionsBrowse({
      pageSize: 2,
      repository,
    });

    expect(browseSpy).toHaveBeenCalledWith({ pageSize: 2, cursor: null });
    expect(listAllSpy).not.toHaveBeenCalled();
    if (searchSpy) {
      expect(searchSpy).not.toHaveBeenCalled();
    }
    expect(view.institutions.length).toBeLessThanOrEqual(2);
    expect(view.pageSize).toBe(2);
    expect(view.totalCount).toBeGreaterThanOrEqual(view.institutions.length);
    expect(view.institutions.every((card) => typeof card.href === "string")).toBe(true);
  });

  it("second page uses the browse cursor", async () => {
    const repository = await createSeededInstitutionRepository();
    const browseSpy = vi.spyOn(repository, "listPublishedBrowsePage");

    const first = await listPublicInstitutionsBrowse({
      pageSize: 1,
      repository,
    });
    expect(first.nextCursor).toBeTruthy();

    const second = await listPublicInstitutionsBrowse({
      pageSize: 1,
      cursor: first.nextCursor,
      repository,
    });

    expect(browseSpy).toHaveBeenLastCalledWith({
      pageSize: 1,
      cursor: first.nextCursor,
    });
    if (first.institutions[0] && second.institutions[0]) {
      expect(second.institutions[0].id).not.toBe(first.institutions[0].id);
    }
  });
});
