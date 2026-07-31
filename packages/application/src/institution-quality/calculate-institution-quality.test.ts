import {
  createDraftInstitution,
  createPublishedInstitution,
  InstitutionType,
  InstitutionVerification,
  QualityLevel,
  RecommendationType,
} from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import { calculateInstitutionQuality } from "./calculate-institution-quality";

const timestamps = {
  createdAt: "2026-07-15T10:00:00.000Z",
  updatedAt: "2026-07-15T12:00:00.000Z",
};

describe("calculateInstitutionQuality", () => {
  it("returns quality score plus profile recommendations from the rule engine", () => {
    const institution = createDraftInstitution({
      id: "inst_q",
      name: "Test Anaokulu",
      slug: "test-anaokulu",
      primaryType: InstitutionType.Kindergarten,
      location: {
        cityId: "city_ist",
        districtId: "dist_kadikoy",
        address: "Adres",
      },
      shortDescription: "Kısa açıklama metni burada.",
      ...timestamps,
    });

    const result = calculateInstitutionQuality({ institution });
    expect(result.quality.score).toBeGreaterThanOrEqual(0);
    expect(result.quality.score).toBeLessThanOrEqual(100);
    expect(result.quality.qualityLevel).toBeTruthy();
    expect(
      result.recommendations.some((item) => item.type === RecommendationType.CompleteProfile),
    ).toBe(true);
    expect(
      result.recommendations.some((item) => item.type === RecommendationType.UploadPhotos),
    ).toBe(true);
  });

  it("scores verified rich profiles as excellent with fewer recommendations", () => {
    const institution = createPublishedInstitution({
      id: "inst_rich_q",
      name: "Kaliteli Kurum",
      slug: "kaliteli-kurum",
      primaryType: InstitutionType.Dershane,
      verification: InstitutionVerification.Verified,
      location: {
        cityId: "city_ank",
        districtId: "dist_cankaya",
        address: "Kızılay Cad. No:10",
        latitude: 39.9,
        longitude: 32.8,
      },
      contact: { phone: "+90 312 000 00 00", email: "info@example.com" },
      socialLinks: {
        websiteUrl: "https://example.com",
        instagramUrl: "https://instagram.com/example",
      },
      shortDescription: "Ankara için kapsamlı dershane profili örneği burada.",
      longDescription:
        "Detaylı açıklama metni en az seksen karakter uzunluğunda olmalı; ebeveyn güvenini destekleyen içerik.",
      programsSummary: "YKS sayısal",
      ageOrLevelFocus: "Lise",
      logoUrl: "https://example.com/logo.png",
      coverImageUrl: "https://example.com/cover.jpg",
      publishedAt: "2026-07-15T11:00:00.000Z",
      ...timestamps,
    });

    const result = calculateInstitutionQuality({ institution });
    expect(result.quality.qualityLevel).toBe(QualityLevel.Excellent);
    expect(result.quality.missingFields).toHaveLength(0);
  });
});
