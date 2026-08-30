import {
  createInstitutionSearchQuery,
  type InstitutionSearchRepository,
} from "@eduatlas/application";
import { InstitutionType } from "@eduatlas/domain";
import { createSeededInstitutionRepository } from "@eduatlas/firebase/server";
import { describe, expect, it, vi } from "vitest";
import { searchPublicInstitutions } from "./search-public-institutions";

describe("searchPublicInstitutions", () => {
  it("empty unscoped browse requires city (no repository call)", async () => {
    const repository = (await createSeededInstitutionRepository()) as InstitutionSearchRepository;
    const searchSpy = vi.spyOn(repository, "search");

    const view = await searchPublicInstitutions({
      text: "",
      pageSize: 12,
      repository,
    });

    expect(searchSpy).not.toHaveBeenCalled();
    expect(view.locationRequired).toBe(true);
    expect(view.institutions).toEqual([]);
  });

  it("empty browse with city scope uses structured browse path", async () => {
    const repository = await createSeededInstitutionRepository();
    const listSpy = vi.spyOn(repository, "list");
    const searchSpy = vi.spyOn(repository, "search");

    const view = await searchPublicInstitutions({
      text: "",
      pageSize: 12,
      filters: { cityId: "city_istanbul" },
      repository,
    });

    expect(searchSpy).toHaveBeenCalled();
    expect(listSpy).not.toHaveBeenCalled();
    expect(view.locationRequired).toBe(false);
    expect(view.institutions.length).toBeLessThanOrEqual(12);
    expect(view.result.page.pageSize).toBe(12);
  });

  it("returns InstitutionCard DTOs for keyword matches when city is scoped", async () => {
    const repository = (await createSeededInstitutionRepository()) as InstitutionSearchRepository;
    const view = await searchPublicInstitutions({
      text: "marmara",
      filters: { cityId: "city_istanbul" },
      repository,
    });

    expect(view.locationRequired).toBe(false);
    expect(view.institutions.length).toBeGreaterThan(0);
    expect(view.institutions.every((card) => card.href.startsWith("/institutions/"))).toBe(true);
    expect(view.institutions.some((card) => card.name.includes("Marmara"))).toBe(true);
  });

  it("returns zero-result state without throwing for scoped miss", async () => {
    const repository = (await createSeededInstitutionRepository()) as InstitutionSearchRepository;
    const view = await searchPublicInstitutions({
      text: "kesinlikle-yok-xyz-999",
      filters: { cityId: "city_istanbul" },
      repository,
    });

    expect(view.locationRequired).toBe(false);
    expect(view.institutions).toEqual([]);
    expect(view.result.page.totalItems).toBe(0);
  });

  it("marks generic-only queries so the empty state can hint for a distinctive name", async () => {
    const repository = (await createSeededInstitutionRepository()) as InstitutionSearchRepository;
    const view = await searchPublicInstitutions({
      text: "Özel Öğretim Kursu",
      filters: { cityId: "city_istanbul" },
      repository,
    });

    expect(view.genericQueryHint).toBe(true);
    expect(view.institutions).toEqual([]);
  });

  it("REGRESSION: unscoped free-text never calls repository.search (no listAll)", async () => {
    const repository = (await createSeededInstitutionRepository()) as InstitutionSearchRepository;
    const searchSpy = vi.spyOn(repository, "search");

    const view = await searchPublicInstitutions({
      text: "anaokulu",
      repository,
    });

    expect(searchSpy).not.toHaveBeenCalled();
    expect(view.locationRequired).toBe(true);
    expect(view.institutions).toEqual([]);
    expect(view.result.page.totalItems).toBe(0);
    expect(view.nextCursor).toBeNull();
  });

  it("unscoped free-text with type filter still requires city (no repository call)", async () => {
    const repository = (await createSeededInstitutionRepository()) as InstitutionSearchRepository;
    const searchSpy = vi.spyOn(repository, "search");

    const view = await searchPublicInstitutions({
      text: "anaokulu",
      filters: { primaryType: InstitutionType.Kindergarten },
      repository,
    });

    expect(searchSpy).not.toHaveBeenCalled();
    expect(view.locationRequired).toBe(true);
  });

  it("scoped free-text with city + district calls repository search", async () => {
    const repository = (await createSeededInstitutionRepository()) as InstitutionSearchRepository;
    const searchSpy = vi.spyOn(repository, "search");

    await searchPublicInstitutions({
      text: "marmara",
      filters: { cityId: "city_istanbul", districtId: "dist_kadikoy" },
      repository,
    });

    expect(searchSpy).toHaveBeenCalled();
  });

  it("excludes unpublished institutions from repository search", async () => {
    const repository = (await createSeededInstitutionRepository()) as InstitutionSearchRepository;
    const result = await repository.search(
      createInstitutionSearchQuery({ text: "üniversite", page: 1, pageSize: 50 }),
    );

    expect(result.page.items.every((item) => item.status === "published")).toBe(true);
  });
});
