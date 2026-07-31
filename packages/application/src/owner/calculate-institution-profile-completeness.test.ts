import {
  createPublishedInstitution,
  InstitutionType,
  InstitutionVerification,
  ProfileCompletenessSectionId,
} from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import type { InstitutionRepository } from "../institutions/institution-repository";
import { calculateInstitutionProfileCompleteness } from "./calculate-institution-profile-completeness";

class StubInstitutionRepository implements Pick<InstitutionRepository, "getById"> {
  constructor(
    private readonly institution: Awaited<ReturnType<InstitutionRepository["getById"]>>,
  ) {}

  async getById() {
    return this.institution;
  }
}

describe("calculateInstitutionProfileCompleteness", () => {
  it("calculates weighted completeness and missing sections", async () => {
    const institution = createPublishedInstitution({
      id: "seed_inst_ist_kolej_1",
      name: "Kadıköy Marmara Koleji",
      slug: "kadikoy-marmara-koleji",
      primaryType: InstitutionType.PrivateSchool,
      verification: InstitutionVerification.Verified,
      location: {
        cityId: "city_istanbul",
        districtId: "dist_kadikoy",
        address: "Caferağa Mah. Moda Cad. No:42",
      },
      contact: {
        phone: "+90 216 330 45 67",
        email: "iletisim@marmarakoleji.k12.tr",
      },
      socialLinks: {
        websiteUrl: "https://www.marmarakoleji.k12.tr",
      },
      shortDescription: "Kısa açıklama",
      programsSummary: "İlkokul–lise",
      publishedAt: "2026-07-01T10:00:00.000Z",
      createdAt: "2026-07-01T10:00:00.000Z",
      updatedAt: "2026-07-01T10:00:00.000Z",
    });

    const result = await calculateInstitutionProfileCompleteness(
      { institutionId: "seed_inst_ist_kolej_1" },
      {
        institutionRepository: new StubInstitutionRepository(
          institution,
        ) as unknown as InstitutionRepository,
      },
    );

    expect(result).not.toBeNull();
    expect(result?.overallPercentage).toBeLessThan(100);
    expect(result?.missingSections.map((section) => section.id)).toEqual(
      expect.arrayContaining([
        ProfileCompletenessSectionId.Description,
        ProfileCompletenessSectionId.Gallery,
        ProfileCompletenessSectionId.Logo,
        ProfileCompletenessSectionId.SocialLinks,
        ProfileCompletenessSectionId.Amenities,
      ]),
    );
    expect(result?.nextActionHint).toMatch(/galeri|açıklama|sosyal|logo/i);
  });

  it("returns null when institution is missing", async () => {
    const result = await calculateInstitutionProfileCompleteness(
      { institutionId: "missing" },
      {
        institutionRepository: new StubInstitutionRepository(
          null,
        ) as unknown as InstitutionRepository,
      },
    );
    expect(result).toBeNull();
  });
});
