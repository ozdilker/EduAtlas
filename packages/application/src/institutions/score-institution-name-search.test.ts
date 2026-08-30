import { describe, expect, it } from "vitest";
import { scoreInstitutionNameSearch } from "./score-institution-name-search";

describe("scoreInstitutionNameSearch", () => {
  it("ranks exact name above a single distinctive token hit", () => {
    const exact = scoreInstitutionNameSearch("Kadro Kurs", { name: "Kadro Kurs" });
    const partial = scoreInstitutionNameSearch("Kadro Kurs", {
      name: "GENÇ KADRO ÖZEL ÖĞRETİM KURSU",
    });
    expect(exact).toBeGreaterThan(partial);
    expect(partial).toBeGreaterThan(0);
  });

  it("does not match bilgi against bilimleri via substring", () => {
    expect(
      scoreInstitutionNameSearch("bilgi", { name: "İNCİRLİ FEN BİLİMLERİ LOCA" }),
    ).toBe(0);
    expect(scoreInstitutionNameSearch("Bilgi", { name: "ÖZEL BAKIRKÖY BİLGİ KURSU" })).toBeGreaterThan(
      0,
    );
  });

  it("does not score generic-only queries except exact name equality", () => {
    expect(scoreInstitutionNameSearch("Özel Öğretim Kursu", { name: "SEZON AKADEMİ ÖZEL ÖĞRETİM KURSU" })).toBe(
      0,
    );
    expect(
      scoreInstitutionNameSearch("Özel Öğretim Kursu", { name: "Özel Öğretim Kursu" }),
    ).toBeGreaterThan(0);
  });

  it("does not use kurs as a ranking signal for Kadro Kurs", () => {
    const kadro = scoreInstitutionNameSearch("Kadro Kurs", {
      name: "GENÇ KADRO ÖZEL ÖĞRETİM KURSU",
    });
    const unrelatedKurs = scoreInstitutionNameSearch("Kadro Kurs", {
      name: "SEZON AKADEMİ ÖZEL ÖĞRETİM KURSU",
    });
    expect(kadro).toBeGreaterThan(0);
    expect(unrelatedKurs).toBe(0);
  });

  it("does not lift a non-matching course via quality or premium", () => {
    expect(
      scoreInstitutionNameSearch("Bilgi", {
        name: "NET BİLİM",
        qualityScore: 99,
        isPremium: true,
      }),
    ).toBe(0);
  });
});
