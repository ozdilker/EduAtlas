import { describe, expect, it } from "vitest";
import {
  assertInstitutionPublishable,
  canAppearInPublicSearch,
  createDraftInstitution,
  createInstitution,
  createInstitutionContact,
  createInstitutionId,
  createInstitutionLocation,
  createInstitutionSearchDocument,
  createInstitutionSocialLinks,
  createPublishedInstitution,
  foldTurkishText,
  getInstitutionTypeSlug,
  hasPublishableContact,
  InstitutionStatus,
  InstitutionType,
  InstitutionVerification,
  institutionIdsEqual,
  isValidInstitutionSlug,
  parseInstitutionType,
  toInstitutionSearchDocument,
  validateInstitutionForPublish,
} from "./index";

const timestamps = {
  createdAt: "2026-07-14T10:00:00.000Z",
  updatedAt: "2026-07-14T12:00:00.000Z",
};

describe("InstitutionId", () => {
  it("creates an immutable id", () => {
    const id = createInstitutionId("inst_123");
    expect(id.value).toBe("inst_123");
    expect(Object.isFrozen(id)).toBe(true);
    expect(institutionIdsEqual(id, createInstitutionId("inst_123"))).toBe(true);
  });

  it("rejects empty ids", () => {
    expect(() => createInstitutionId("")).toThrow(/InstitutionId/);
  });
});

describe("enums", () => {
  it("parses institution types and exposes slugs", () => {
    expect(parseInstitutionType("kindergarten")).toBe(InstitutionType.Kindergarten);
    expect(getInstitutionTypeSlug(InstitutionType.Kindergarten)).toBe("anaokulu");
  });
});

describe("value objects", () => {
  it("creates immutable location, contact, and social links", () => {
    const location = createInstitutionLocation({
      cityId: "city_ist",
      districtId: "dist_kadikoy",
      address: "Caferağa Mah. Örnek Sok. No:1",
    });
    const contact = createInstitutionContact({
      phone: "+90 216 000 00 00",
      email: "info@example.com",
    });
    const social = createInstitutionSocialLinks({
      websiteUrl: "https://example.com",
    });

    expect(Object.isFrozen(location)).toBe(true);
    expect(Object.isFrozen(contact)).toBe(true);
    expect(Object.isFrozen(social)).toBe(true);
    expect(hasPublishableContact(contact)).toBe(true);
    expect(hasPublishableContact(createInstitutionContact({}))).toBe(false);
  });

  it("rejects invalid social URLs", () => {
    expect(() => createInstitutionSocialLinks({ websiteUrl: "not-a-url" })).toThrow(/websiteUrl/);
    expect(() => createInstitutionSocialLinks({ instagramUrl: "instagram.com/okul" })).toThrow(
      /instagramUrl/,
    );
    expect(() => createInstitutionSocialLinks({ facebookUrl: "ftp://facebook.com/okul" })).toThrow(
      /facebookUrl/,
    );
  });

  it("normalizes http(s) social URLs for all platforms", () => {
    const social = createInstitutionSocialLinks({
      websiteUrl: "https://www.ornek.edu.tr",
      instagramUrl: "https://instagram.com/ornek",
      facebookUrl: "https://facebook.com/ornek",
      twitterUrl: "https://x.com/ornek",
      linkedinUrl: "https://linkedin.com/company/ornek",
      youtubeUrl: "https://youtube.com/@ornek",
    });

    expect(social.websiteUrl).toBe("https://www.ornek.edu.tr/");
    expect(social.instagramUrl).toBe("https://instagram.com/ornek");
    expect(social.facebookUrl).toBe("https://facebook.com/ornek");
    expect(social.twitterUrl).toBe("https://x.com/ornek");
    expect(social.linkedinUrl).toBe("https://linkedin.com/company/ornek");
    expect(social.youtubeUrl).toBe("https://youtube.com/@ornek");
  });
});

describe("Institution entity", () => {
  it("creates an immutable draft via factory", () => {
    const institution = createDraftInstitution({
      id: "inst_1",
      name: "Örnek Anaokulu",
      slug: "ornek-anaokulu",
      primaryType: InstitutionType.Kindergarten,
      location: {
        cityId: "city_ist",
        districtId: "dist_kadikoy",
        address: "Caferağa Mah. Örnek Sok. No:1",
      },
      contact: { email: "info@example.com" },
      shortDescription: "Aileler için örnek anaokulu profili.",
      ...timestamps,
    });

    expect(institution.status).toBe(InstitutionStatus.Draft);
    expect(institution.verification).toBe(InstitutionVerification.Unclaimed);
    expect(Object.isFrozen(institution)).toBe(true);
    expect(canAppearInPublicSearch(institution)).toBe(false);
    expect(isValidInstitutionSlug(institution.slug)).toBe(true);
  });

  it("creates a published institution and search document", () => {
    const institution = createPublishedInstitution({
      id: "inst_2",
      name: "Güneş Dershane",
      slug: "gunes-dershane",
      primaryType: InstitutionType.Dershane,
      verification: InstitutionVerification.Verified,
      location: {
        cityId: "city_ank",
        districtId: "dist_cankaya",
        address: "Kızılay Cad. No:10",
        geohash: "sxk4",
      },
      contact: { phone: "+90 312 000 00 00" },
      shortDescription: "Ankara dershane örneği.",
      isPremium: true,
      qualityScore: 82,
      publishedAt: "2026-07-14T11:00:00.000Z",
      ...timestamps,
    });

    expect(validateInstitutionForPublish(institution).ok).toBe(true);
    expect(() => assertInstitutionPublishable(institution)).not.toThrow();
    expect(canAppearInPublicSearch(institution)).toBe(true);

    const searchDoc = toInstitutionSearchDocument(institution, {
      citySlug: "ankara",
      cityName: "Ankara",
      districtSlug: "cankaya",
      districtName: "Çankaya",
    });

    expect(searchDoc.nameFolded).toContain("gunes");
    expect(searchDoc.typeSlug).toBe("dershane");
    expect(searchDoc.isPremium).toBe(true);
    expect(Object.isFrozen(searchDoc)).toBe(true);
    expect(Object.isFrozen(searchDoc.searchKeywords)).toBe(true);
  });

  it("rejects search documents for unpublished institutions", () => {
    expect(() =>
      createInstitutionSearchDocument({
        id: "inst_3",
        slug: "draft-okul",
        name: "Draft",
        primaryType: InstitutionType.PrivateSchool,
        cityId: "c1",
        citySlug: "istanbul",
        cityName: "İstanbul",
        districtId: "d1",
        districtSlug: "kadikoy",
        districtName: "Kadıköy",
        status: InstitutionStatus.Draft,
        verification: InstitutionVerification.Unclaimed,
        updatedAt: timestamps.updatedAt,
      }),
    ).toThrow(/published/);
  });

  it("requires contact to publish", () => {
    const institution = createInstitution({
      id: "inst_4",
      name: "Eksik İletişim",
      slug: "eksik-iletisim",
      primaryType: InstitutionType.Preschool,
      status: InstitutionStatus.Draft,
      location: {
        cityId: "city_ist",
        districtId: "dist_kadikoy",
        address: "Adres",
      },
      shortDescription: "İletişimsiz taslak.",
      ...timestamps,
    });

    const result = validateInstitutionForPublish(institution);
    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.includes("phone or email"))).toBe(true);
  });
});

describe("validation helpers", () => {
  it("folds Turkish text for search", () => {
    expect(foldTurkishText("Şişli Öğrenci")).toBe("sisli ogrenci");
  });
});
