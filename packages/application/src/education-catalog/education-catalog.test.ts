import {
  createEducationCatalogItem,
  EducationCatalogKind,
  EducationCatalogStatus,
} from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import type { EducationCatalogRepository } from "./education-catalog-repository";
import {
  getEducationCatalogItemBySlug,
  listEducationCatalogItems,
} from "./list-education-catalog-items";

const timestamps = {
  createdAt: "2026-07-15T14:00:00.000Z",
  updatedAt: "2026-07-15T14:00:00.000Z",
};

describe("education catalog application services", () => {
  it("lists and resolves catalog items via repository port", async () => {
    const item = createEducationCatalogItem({
      id: "private_school",
      kind: EducationCatalogKind.InstitutionTypes,
      slug: "ozel-okul",
      name: "Özel Okul",
      description: "Özel okul kurum türü.",
      order: 1,
      status: EducationCatalogStatus.Published,
      ...timestamps,
    });

    const repository: EducationCatalogRepository = {
      kind: EducationCatalogKind.InstitutionTypes,
      async getById(id) {
        return id === item.id.value ? item : null;
      },
      async getBySlug(slug) {
        return slug === item.slug ? item : null;
      },
      async list() {
        return Object.freeze([item]);
      },
    };

    const deps = { getRepository: () => repository };
    const listed = await listEducationCatalogItems(
      { kind: EducationCatalogKind.InstitutionTypes },
      deps,
    );
    expect(listed).toHaveLength(1);

    const bySlug = await getEducationCatalogItemBySlug(
      { kind: EducationCatalogKind.InstitutionTypes, slug: "ozel-okul" },
      deps,
    );
    expect(bySlug?.id.value).toBe("private_school");
  });
});
