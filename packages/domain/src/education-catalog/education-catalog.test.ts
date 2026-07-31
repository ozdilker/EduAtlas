import { describe, expect, it } from "vitest";
import { createEducationCatalogItem, EducationCatalogKind, EducationCatalogStatus } from "./index";

const timestamps = {
  createdAt: "2026-07-15T14:00:00.000Z",
  updatedAt: "2026-07-15T14:00:00.000Z",
};

describe("education catalog item", () => {
  it("creates a published taxonomy item with optional parent", () => {
    const parent = createEducationCatalogItem({
      id: "yks",
      kind: EducationCatalogKind.ExamTypes,
      slug: "yks",
      name: "YKS",
      description: "Yükseköğretim Kurumları Sınavı.",
      order: 1,
      ...timestamps,
    });
    const child = createEducationCatalogItem({
      id: "yks-tyt",
      kind: EducationCatalogKind.ExamTypes,
      slug: "yks-tyt",
      name: "TYT",
      description: "Temel Yeterlilik Testi.",
      parentId: parent.id.value,
      order: 2,
      ...timestamps,
    });

    expect(parent.status).toBe(EducationCatalogStatus.Published);
    expect(child.parentId?.value).toBe("yks");
    expect(Object.isFrozen(child)).toBe(true);
  });

  it("rejects empty name or self-parent", () => {
    expect(() =>
      createEducationCatalogItem({
        id: "x",
        kind: EducationCatalogKind.Languages,
        slug: "ingilizce",
        name: " ",
        description: "Açıklama",
        ...timestamps,
      }),
    ).toThrow(/name/);

    expect(() =>
      createEducationCatalogItem({
        id: "montessori",
        kind: EducationCatalogKind.EducationalApproaches,
        slug: "montessori",
        name: "Montessori",
        description: "Çocuk merkezli yaklaşım.",
        parentId: "montessori",
        ...timestamps,
      }),
    ).toThrow(/parentId/);
  });
});
