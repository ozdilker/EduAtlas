import { describe, expect, it } from "vitest";
import {
  computeInstitutionSearchIndexFields,
  distinctiveSearchTokens,
  isInstitutionSearchStopword,
  pickInstitutionSearchProbeToken,
  tokenizeInstitutionSearchKeywords,
} from "./institution-search-tokens";
import { tokenizeSearchKeywords } from "./validation";

describe("institution search tokens", () => {
  it("treats folded stopwords as stopwords including Özel", () => {
    expect(isInstitutionSearchStopword("Özel")).toBe(true);
    expect(isInstitutionSearchStopword("özel")).toBe(true);
    expect(isInstitutionSearchStopword("ozel")).toBe(true);
    expect(isInstitutionSearchStopword("kursu")).toBe(true);
    expect(isInstitutionSearchStopword("bilgi")).toBe(false);
  });

  it("indexes name-only distinctive tokens", () => {
    expect([...tokenizeInstitutionSearchKeywords("BİLGİ ÖZEL ÖĞRETİM KURSU")]).toEqual(["bilgi"]);
    expect([...tokenizeSearchKeywords("BİLGİ ÖZEL ÖĞRETİM KURSU")]).toEqual(["bilgi"]);
    expect([...tokenizeInstitutionSearchKeywords("GENÇ KADRO ÖZEL ÖĞRETİM KURSU")]).toEqual([
      "genc",
      "kadro",
    ]);
  });

  it("does not index address junk or numeric codes", () => {
    expect(tokenizeInstitutionSearchKeywords("Mah Cad Sk No 12")).toEqual([]);
    expect(tokenizeInstitutionSearchKeywords("Kurum 5153505820")).toEqual(["kurum"]);
  });

  it("does not fall back to generic tokens at query time", () => {
    expect([...distinctiveSearchTokens("Bilgi Özel Öğretim Kursu")]).toEqual(["bilgi"]);
    expect([...distinctiveSearchTokens("Kadro Kurs")]).toEqual(["kadro"]);
    expect([...distinctiveSearchTokens("Özel Öğretim Kursu")]).toEqual([]);
    expect([...distinctiveSearchTokens("Kurs")]).toEqual([]);
    expect([...distinctiveSearchTokens("Bilgi")]).toEqual(["bilgi"]);
    expect([...distinctiveSearchTokens("BİLGİ")]).toEqual(["bilgi"]);
  });

  it("drops geo fragments copied from city/district filters", () => {
    expect([
      ...distinctiveSearchTokens("Bakırköy Açı Özel Öğretim Kursu", {
        cityId: "istanbul",
        districtId: "istanbul-bakirkoy",
      }),
    ]).toEqual(["aci"]);
  });

  it("picks the longest distinctive probe token", () => {
    expect(pickInstitutionSearchProbeToken(["fen", "bilgi"])).toBe("bilgi");
    expect(pickInstitutionSearchProbeToken(["kadro"])).toBe("kadro");
    expect(pickInstitutionSearchProbeToken([])).toBeUndefined();
  });

  it("computes index fields from the name only", () => {
    const fields = computeInstitutionSearchIndexFields("BİLGİ ÖZEL ÖĞRETİM KURSU");
    expect(fields.nameFolded).toBe("bilgi ozel ogretim kursu");
    expect([...fields.searchKeywords]).toEqual(["bilgi"]);
  });
});
