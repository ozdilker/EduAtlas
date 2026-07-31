import {
  createLead,
  createPublishedInstitution,
  InstitutionType,
  InstitutionVerification,
  LeadStatus,
} from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import { computeInstitutionProfileCompleteness } from "./profile-completeness";
import { evaluateOwnerRecommendationRules } from "./recommendation-rules";

const NOW = "2026-07-14T18:00:00.000Z";

function baseInstitution(
  overrides: Partial<Parameters<typeof createPublishedInstitution>[0]> = {},
) {
  return createPublishedInstitution({
    id: "inst_rec_1",
    name: "Öneri Test Koleji",
    slug: "oneri-test-koleji",
    primaryType: InstitutionType.PrivateSchool,
    verification: InstitutionVerification.Verified,
    location: {
      cityId: "city_istanbul",
      districtId: "dist_kadikoy",
      address: "Test Mah. No:1",
    },
    contact: {
      phone: "+90 216 000 00 00",
      email: "info@test.edu.tr",
    },
    shortDescription: "Test kurum açıklaması",
    programsSummary: "İlkokul",
    ageOrLevelFocus: "6–10",
    publishedAt: "2026-07-01T10:00:00.000Z",
    createdAt: "2026-07-01T10:00:00.000Z",
    updatedAt: "2026-07-01T10:00:00.000Z",
    ...overrides,
  });
}

function completeInstitution() {
  return baseInstitution({
    shortDescription:
      "Kadıköy’de ailelere güvenli ve çağdaş eğitim sunan özel okul. Çift dilli program ve güçlü rehberlik.",
    longDescription:
      "Kurumumuz anaokulundan liseye kadar uzanan programlarla öğrencilerin akademik ve sosyal gelişimini destekler. Deneyimli kadro, güvenli kampüs ve bireysel takip ile ailelerin yanında yer alırız. STEM, sanat ve spor etkinlikleriyle dengeli bir eğitim ortamı sunuyoruz.",
    logoUrl: "https://example.com/logo.png",
    coverImageUrl: "https://example.com/cover.png",
    galleryImages: [
      "https://example.com/g1.png",
      "https://example.com/g2.png",
      "https://example.com/g3.png",
    ],
    socialLinks: {
      websiteUrl: "https://example.com",
      instagramUrl: "https://instagram.com/example",
    },
    contact: {
      phone: "+90 216 000 00 00",
      email: "info@test.edu.tr",
      whatsappNumber: "+90 532 000 00 00",
    },
    location: {
      cityId: "city_istanbul",
      districtId: "dist_kadikoy",
      address: "Test Mah. No:1",
      googleMapsUrl: "https://maps.google.com/?q=Kadikoy",
    },
    programsSummary: "İlkokul, ortaokul ve lise programları",
    educationPrograms: ["primary", "middle_school"],
    amenities: ["shuttle", "library"],
    workingHours: {
      monday: { isOpen: true, openTime: "08:00", closeTime: "17:00" },
      tuesday: { isOpen: true, openTime: "08:00", closeTime: "17:00" },
      wednesday: { isOpen: true, openTime: "08:00", closeTime: "17:00" },
      thursday: { isOpen: true, openTime: "08:00", closeTime: "17:00" },
      friday: { isOpen: true, openTime: "08:00", closeTime: "17:00" },
      saturday: { isOpen: false },
      sunday: { isOpen: false },
    },
    faqs: [{ id: "faq_1", question: "Kayıt nasıl yapılır?", answer: "Online başvuru." }],
    brochurePdfUrl: "https://example.com/brochure.pdf",
    promoVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    verification: InstitutionVerification.Verified,
  });
}

function lead(id: string, status: LeadStatus, createdAt: string, updatedAt = createdAt) {
  return createLead({
    id,
    institutionId: "inst_rec_1",
    parentName: `Parent ${id}`,
    phone: "+90 532 100 00 00",
    message: "Test",
    status,
    consentAcceptedAt: createdAt,
    createdAt,
    updatedAt,
  });
}

describe("evaluateOwnerRecommendationRules", () => {
  it("fires rule 1 for stale new leads", () => {
    const recommendations = evaluateOwnerRecommendationRules({
      institution: completeInstitution(),
      leads: [lead("l1", LeadStatus.New, "2026-07-12T10:00:00.000Z")],
      now: NOW,
    });

    expect(recommendations.some((item) => item.ruleId === "rule_1")).toBe(true);
  });

  it("fires rule 2 when pending leads exceed 5", () => {
    const leads = Array.from({ length: 6 }, (_, index) => lead(`n${index}`, LeadStatus.New, NOW));
    const recommendations = evaluateOwnerRecommendationRules({
      institution: completeInstitution(),
      leads,
      now: NOW,
    });

    expect(recommendations.some((item) => item.ruleId === "rule_2")).toBe(true);
  });

  it("fires rule 3 when enrolled this month is zero", () => {
    const recommendations = evaluateOwnerRecommendationRules({
      institution: completeInstitution(),
      leads: [lead("e1", LeadStatus.Enrolled, "2026-06-01T10:00:00.000Z")],
      now: NOW,
    });

    expect(recommendations.some((item) => item.ruleId === "rule_3")).toBe(true);
  });

  it("analyzes incomplete profile and returns field-specific sales tips", () => {
    const institution = baseInstitution({
      programsSummary: undefined,
      ageOrLevelFocus: undefined,
      logoUrl: undefined,
      coverImageUrl: undefined,
      galleryImages: undefined,
      longDescription: undefined,
    });
    const completeness = computeInstitutionProfileCompleteness(institution);
    expect(completeness.scorePercent).toBeLessThan(80);

    const recommendations = evaluateOwnerRecommendationRules({
      institution,
      leads: [lead("c1", LeadStatus.Contacted, NOW), lead("e1", LeadStatus.Enrolled, NOW)],
      now: NOW,
    });

    expect(recommendations.some((item) => item.ruleId === "rule_4")).toBe(true);
    expect(recommendations.some((item) => item.ruleId === "rule_5")).toBe(true);
    expect(recommendations.some((item) => item.ruleId === "rule_logo")).toBe(true);
    expect(recommendations.some((item) => item.ruleId === "rule_long_desc")).toBe(true);
    expect(recommendations.some((item) => item.ruleId === "rule_programs")).toBe(true);
    expect(recommendations.length).toBeGreaterThan(5);
  });

  it("does not invent recommendations when profile and leads are healthy", () => {
    const recommendations = evaluateOwnerRecommendationRules({
      institution: completeInstitution(),
      leads: [lead("c1", LeadStatus.Contacted, NOW), lead("e1", LeadStatus.Enrolled, NOW)],
      now: NOW,
    });

    expect(recommendations).toHaveLength(0);
  });
});
