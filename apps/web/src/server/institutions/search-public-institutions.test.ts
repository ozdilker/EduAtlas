import {
  createInstitutionSearchQuery,
  type InstitutionSearchRepository,
} from "@eduatlas/application";
import { createSeededInstitutionRepository } from "@eduatlas/firebase/server";
import { describe, expect, it } from "vitest";
import { searchPublicInstitutions } from "./search-public-institutions";

describe("searchPublicInstitutions", () => {
  it("returns InstitutionCard DTOs for keyword matches", async () => {
    const repository = (await createSeededInstitutionRepository()) as InstitutionSearchRepository;
    const view = await searchPublicInstitutions({
      text: "marmara",
      repository,
    });

    expect(view.institutions.length).toBeGreaterThan(0);
    expect(view.institutions.every((card) => card.href.startsWith("/institutions/"))).toBe(true);
    expect(view.institutions.some((card) => card.name.includes("Marmara"))).toBe(true);
  });

  it("returns zero-result state without throwing", async () => {
    const repository = (await createSeededInstitutionRepository()) as InstitutionSearchRepository;
    const view = await searchPublicInstitutions({
      text: "kesinlikle-yok-xyz-999",
      repository,
    });

    expect(view.institutions).toEqual([]);
    expect(view.result.page.totalItems).toBe(0);
  });

  it("excludes unpublished institutions from search", async () => {
    const repository = (await createSeededInstitutionRepository()) as InstitutionSearchRepository;
    const result = await repository.search(
      createInstitutionSearchQuery({ text: "üniversite", page: 1, pageSize: 50 }),
    );

    expect(result.page.items.every((item) => item.status === "published")).toBe(true);
  });
});
