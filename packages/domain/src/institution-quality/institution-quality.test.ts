import { describe, expect, it } from "vitest";
import {
  createDraftInstitution,
  createPublishedInstitution,
  InstitutionType,
  InstitutionVerification,
  QualityGrade,
  QualityLevel,
} from "../index";
import { evaluateInstitutionQuality } from "./evaluate-institution-quality";
import { qualityGradeFromScore } from "./quality-grade";
import { qualityLevelFromScore } from "./quality-level";

const timestamps = {
  createdAt: "2026-07-15T10:00:00.000Z",
  updatedAt: "2026-07-15T12:00:00.000Z",
};

describe("institution quality engine", () => {
  it("maps scores to grades and levels", () => {
    expect(qualityGradeFromScore(95)).toBe(QualityGrade.A);
    expect(qualityGradeFromScore(42)).toBe(QualityGrade.F);
    expect(qualityLevelFromScore(30)).toBe(QualityLevel.Critical);
    expect(qualityLevelFromScore(55)).toBe(QualityLevel.NeedsWork);
    expect(qualityLevelFromScore(75)).toBe(QualityLevel.Healthy);
    expect(qualityLevelFromScore(90)).toBe(QualityLevel.Excellent);
  });

  it("scores a sparse draft below healthy with missing fields and issues", () => {
    const institution = createDraftInstitution({
      id: "inst_sparse",
      name: "Eksik Profil",
      slug: "eksik-profil",
      primaryType: InstitutionType.Kindergarten,
      location: {
        cityId: "city_ist",
        districtId: "dist_kadikoy",
        address: "Adres",
      },
      shortDescription: "Kısa.",
      ...timestamps,
    });

    const quality = evaluateInstitutionQuality({
      institution,
      now: "2026-07-15T15:00:00.000Z",
    });

    expect(quality.score).toBeLessThan(70);
    expect(quality.qualityLevel).not.toBe(QualityLevel.Excellent);
    expect(quality.missingFields.length).toBeGreaterThan(0);
    expect(quality.qualityIssues.some((issue) => issue.code === "missing_phone")).toBe(true);
    expect(quality.qualityIssues.some((issue) => issue.code === "missing_website")).toBe(true);
    expect(quality.dimensions).toHaveLength(10);
  });

  it("scores a rich verified institution highly", () => {
    const institution = createPublishedInstitution({
      id: "inst_rich",
      name: "Zengin Profil Anaokulu",
      slug: "zengin-profil-anaokulu",
      primaryType: InstitutionType.Kindergarten,
      verification: InstitutionVerification.Verified,
      location: {
        cityId: "city_ist",
        districtId: "dist_kadikoy",
        address: "Caferağa Mah. Örnek Sok. No:1",
        latitude: 40.99,
        longitude: 29.02,
      },
      contact: {
        phone: "+90 216 000 00 00",
        email: "info@example.com",
        whatsappNumber: "+90 532 000 00 00",
      },
      socialLinks: {
        websiteUrl: "https://example.com",
        instagramUrl: "https://instagram.com/example",
        facebookUrl: "https://facebook.com/example",
      },
      shortDescription: "Aileler için kapsamlı anaokulu profili örneği.",
      longDescription:
        "Uzun açıklama metni burada yer alır ve en az seksen karakter olacak şekilde yazılmıştır; ebeveynler için güven verici içerik.",
      programsSummary: "Tam gün, yarım gün, İngilizce destek",
      ageOrLevelFocus: "3–6 yaş",
      logoUrl: "https://example.com/logo.png",
      coverImageUrl: "https://example.com/cover.jpg",
      qualityScore: 0,
      publishedAt: "2026-07-15T11:00:00.000Z",
      ...timestamps,
    });

    const quality = evaluateInstitutionQuality({ institution });
    expect(quality.score).toBeGreaterThanOrEqual(85);
    expect(quality.grade).toBe(QualityGrade.A);
    expect(quality.qualityLevel).toBe(QualityLevel.Excellent);
    expect(quality.missingFields).toHaveLength(0);
  });

  it("accepts owner educationPrograms and googleMapsUrl like profile completeness", () => {
    const institution = createPublishedInstitution({
      id: "inst_owner_fields",
      name: "Sahip Alanları Koleji",
      slug: "sahip-alanlari-koleji",
      primaryType: InstitutionType.PrivateSchool,
      verification: InstitutionVerification.Verified,
      location: {
        cityId: "city_ist",
        districtId: "dist_avcilar",
        address: "Avcılar Mah. Örnek Cad. No:1",
        googleMapsUrl: "https://maps.app.goo.gl/example",
      },
      contact: {
        phone: "+90 212 000 00 00",
        email: "info@example.com",
      },
      socialLinks: {
        websiteUrl: "https://example.com",
        instagramUrl: "https://instagram.com/example",
      },
      shortDescription: "Aileler için kapsamlı okul profili örneği.",
      longDescription:
        "Uzun açıklama metni burada yer alır ve en az seksen karakter olacak şekilde yazılmıştır; ebeveynler için güven verici içerik.",
      educationPrograms: ["lgs", "tyt"],
      logoUrl: "https://example.com/logo.png",
      coverImageUrl: "https://example.com/cover.jpg",
      qualityScore: 0,
      publishedAt: "2026-07-15T11:00:00.000Z",
      ...timestamps,
    });

    const quality = evaluateInstitutionQuality({ institution });
    expect(quality.missingFields).not.toContain("programsSummary");
    expect(quality.missingFields).not.toContain("ageOrLevelFocus");
    expect(quality.missingFields).not.toContain("categories");
    expect(quality.missingFields).not.toContain("location.coordinates");
    expect(quality.score).toBeGreaterThanOrEqual(90);
  });
});
