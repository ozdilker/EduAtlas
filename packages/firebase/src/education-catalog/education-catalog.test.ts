import {
  getEducationCatalogItemById,
  getEducationCatalogItemBySlug,
  getEducationCatalogSummary,
  listEducationCatalogItems,
} from "@eduatlas/application";
import { EducationCatalogKind } from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import { buildEducationCatalogSeedBundle } from "./education-catalog-seed";
import { createSeededEducationCatalogRepositories } from "./seed-education-catalog-collections";

describe("education catalog seed + repositories", () => {
  it("seeds all seven catalogs with published Turkish taxonomy", () => {
    const bundle = buildEducationCatalogSeedBundle();
    expect(bundle.itemsByKind[EducationCatalogKind.InstitutionTypes]).toHaveLength(6);
    expect(bundle.itemsByKind[EducationCatalogKind.Programs].length).toBeGreaterThanOrEqual(8);
    expect(bundle.itemsByKind[EducationCatalogKind.ExamTypes].some((item) => item.parentId)).toBe(
      true,
    );
    expect(bundle.allItems.every((item) => item.status === "published")).toBe(true);
  });

  it("supports list / getById / getBySlug through repository ports", async () => {
    const { getRepository } = await createSeededEducationCatalogRepositories();

    const types = await listEducationCatalogItems(
      { kind: EducationCatalogKind.InstitutionTypes },
      { getRepository },
    );
    expect(types.map((item) => item.id.value)).toContain("dershane");

    const bySlug = await getEducationCatalogItemBySlug(
      { kind: EducationCatalogKind.InstitutionTypes, slug: "anaokulu" },
      { getRepository },
    );
    expect(bySlug?.name).toBe("Anaokulu");

    const byId = await getEducationCatalogItemById(
      { kind: EducationCatalogKind.Languages, id: "lang-en" },
      { getRepository },
    );
    expect(byId?.slug).toBe("ingilizce");

    const children = await listEducationCatalogItems(
      { kind: EducationCatalogKind.ExamTypes, parentId: "exam-yks" },
      { getRepository },
    );
    expect(children.some((item) => item.slug === "tyt")).toBe(true);

    const summary = await getEducationCatalogSummary({ getRepository });
    expect(summary.kinds).toHaveLength(7);
    expect(summary.totalItems).toBeGreaterThan(40);
    expect(summary.note).toMatch(/No institutions/i);
  });
});
