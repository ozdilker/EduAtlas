import { describe, expect, it } from "vitest";
import {
  createPublishedInstitution,
  InstitutionType,
  InstitutionVerification,
} from "../institution";
import { evaluateInstitutionProfileCompleteness } from "./evaluate-institution-profile-completeness";
import { ProfileCompletenessSectionId } from "./profile-completeness-section-id";

describe("InstitutionProfileCompleteness", () => {
  it("returns weighted overallPercentage with completed and missing sections", () => {
    const institution = createPublishedInstitution({
      id: "seed_inst_complete_1",
      name: "Tamamlanma Test Koleji",
      slug: "tamamlanma-test-koleji",
      primaryType: InstitutionType.PrivateSchool,
      verification: InstitutionVerification.Verified,
      location: {
        cityId: "city_istanbul",
        districtId: "dist_kadikoy",
        address: "Test Cad. No:1",
      },
      contact: {
        phone: "+90 216 000 00 00",
        email: "info@test.edu.tr",
      },
      socialLinks: {
        websiteUrl: "https://example.com",
      },
      shortDescription: "Kısa açıklama",
      longDescription: "Uzun açıklama",
      programsSummary: "Programlar",
      educationPrograms: ["primary", "middle_school"],
      amenities: ["library", "parking"],
      logoUrl: "https://example.com/logo.png",
      coverImageUrl: "https://example.com/cover.png",
      publishedAt: "2026-07-01T10:00:00.000Z",
      createdAt: "2026-07-01T10:00:00.000Z",
      updatedAt: "2026-07-01T10:00:00.000Z",
    });

    const result = evaluateInstitutionProfileCompleteness(institution);

    // Total weight 110; SocialLinks (10) missing → 100/110 ≈ 91
    expect(result.overallPercentage).toBe(91);
    expect(result.completedSections.map((section) => section.id)).toContain(
      ProfileCompletenessSectionId.Gallery,
    );
    expect(result.completedSections.map((section) => section.id)).toContain(
      ProfileCompletenessSectionId.Amenities,
    );
    expect(result.missingSections.map((section) => section.id)).toEqual([
      ProfileCompletenessSectionId.SocialLinks,
    ]);
    expect(result.nextActionHint).toMatch(/Sosyal medya/);
  });

  it("marks Programs complete from educationPrograms without programsSummary", () => {
    const institution = createPublishedInstitution({
      id: "seed_inst_programs_select",
      name: "Program Seçimli Okul",
      slug: "program-secimli-okul",
      primaryType: InstitutionType.PrivateSchool,
      verification: InstitutionVerification.Verified,
      location: {
        cityId: "city_istanbul",
        districtId: "dist_kadikoy",
        address: "Test Cad. No:3",
      },
      contact: { phone: "+90 216 222 22 22" },
      socialLinks: {},
      shortDescription: "Kısa",
      educationPrograms: ["yks", "lgs"],
      publishedAt: "2026-07-01T10:00:00.000Z",
      createdAt: "2026-07-01T10:00:00.000Z",
      updatedAt: "2026-07-01T10:00:00.000Z",
    });

    const result = evaluateInstitutionProfileCompleteness(institution);
    expect(result.completedSections.map((section) => section.id)).toContain(
      ProfileCompletenessSectionId.Programs,
    );
    expect(result.missingSections.map((section) => section.id)).toContain(
      ProfileCompletenessSectionId.Amenities,
    );
  });

  it("prioritizes gallery hint when cover image is missing", () => {
    const institution = createPublishedInstitution({
      id: "seed_inst_complete_2",
      name: "Galeri Eksik Koleji",
      slug: "galeri-eksik-koleji",
      primaryType: InstitutionType.PrivateSchool,
      verification: InstitutionVerification.Verified,
      location: {
        cityId: "city_istanbul",
        districtId: "dist_kadikoy",
        address: "Test Cad. No:2",
      },
      contact: { phone: "+90 216 111 11 11" },
      socialLinks: {
        websiteUrl: "https://example.com",
        instagramUrl: "https://instagram.com/example",
      },
      shortDescription: "Kısa",
      longDescription: "Uzun",
      programsSummary: "Program",
      amenities: ["shuttle"],
      logoUrl: "https://example.com/logo.png",
      publishedAt: "2026-07-01T10:00:00.000Z",
      createdAt: "2026-07-01T10:00:00.000Z",
      updatedAt: "2026-07-01T10:00:00.000Z",
    });

    const result = evaluateInstitutionProfileCompleteness(institution);
    expect(result.missingSections[0]?.id).toBe(ProfileCompletenessSectionId.Gallery);
    expect(result.nextActionHint).toMatch(/galeri/i);
  });
});
