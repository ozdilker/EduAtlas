import { describe, expect, it } from "vitest";
import {
  createInstitutionHighlights,
  INSTITUTION_HIGHLIGHT_MAX_ITEMS,
} from "./institution-highlights";

describe("institution highlights", () => {
  it("normalizes ordered title/description items", () => {
    const highlights = createInstitutionHighlights([
      { id: "hl_1", title: "Küçük sınıflar", description: "Sınıf mevcudu 16’yı geçmez." },
      { title: "Güvenli kampüs", description: "Kontrollü giriş ve kamera sistemi." },
    ]);
    expect(highlights).toEqual([
      { id: "hl_1", title: "Küçük sınıflar", description: "Sınıf mevcudu 16’yı geçmez." },
      {
        id: "highlight_2",
        title: "Güvenli kampüs",
        description: "Kontrollü giriş ve kamera sistemi.",
      },
    ]);
    expect(Object.isFrozen(highlights)).toBe(true);
  });

  it("drops empty rows and rejects incomplete ones", () => {
    expect(createInstitutionHighlights([{ title: "", description: "" }])).toEqual([]);
    expect(() =>
      createInstitutionHighlights([{ title: "Başlık", description: "" }]),
    ).toThrow(/description is required/);
  });

  it("enforces max items", () => {
    const tooMany = Array.from({ length: INSTITUTION_HIGHLIGHT_MAX_ITEMS + 1 }, (_, index) => ({
      title: `Başlık ${index + 1}`,
      description: `Açıklama ${index + 1}`,
    }));
    expect(() => createInstitutionHighlights(tooMany)).toThrow(/at most/);
  });
});
