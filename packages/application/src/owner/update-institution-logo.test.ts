import {
  createPublishedInstitution,
  InstitutionType,
  InstitutionVerification,
} from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import { InstitutionNotFoundError, type InstitutionRepository } from "../institutions";
import { updateInstitutionLogo } from "./update-institution-logo";

class StubInstitutionRepository implements Pick<InstitutionRepository, "getById" | "update"> {
  constructor(private institution: Awaited<ReturnType<InstitutionRepository["getById"]>>) {}

  async getById() {
    return this.institution;
  }

  async update(institution: NonNullable<Awaited<ReturnType<InstitutionRepository["getById"]>>>) {
    this.institution = institution;
    return institution;
  }
}

function published(logoUrl?: string) {
  return createPublishedInstitution({
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
    shortDescription: "Kısa açıklama",
    logoUrl,
    coverImageUrl: "https://cdn.example/cover.jpg",
    publishedAt: "2026-07-01T10:00:00.000Z",
    createdAt: "2026-07-01T10:00:00.000Z",
    updatedAt: "2026-07-01T10:00:00.000Z",
  });
}

describe("updateInstitutionLogo", () => {
  it("updates only logoUrl and audit fields", async () => {
    const repo = new StubInstitutionRepository(published("https://cdn.example/old-logo.png"));
    const saved = await updateInstitutionLogo(
      {
        institutionId: "seed_inst_ist_kolej_1",
        logoUrl: "https://cdn.example/new-logo.png",
        logoPath: "institutions/seed_inst_ist_kolej_1/logo/abc.png",
        updatedBy: "owner_1",
        updatedAt: "2026-07-20T12:00:00.000Z",
      },
      { institutionRepository: repo as unknown as InstitutionRepository },
    );

    expect(saved.logoUrl).toBe("https://cdn.example/new-logo.png");
    expect(saved.coverImageUrl).toBe("https://cdn.example/cover.jpg");
    expect(saved.shortDescription).toBe("Kısa açıklama");
    expect(saved.updatedAt).toBe("2026-07-20T12:00:00.000Z");
    expect(saved.updatedByUserId).toBe("owner_1");
  });

  it("throws when institution is missing", async () => {
    const repo = new StubInstitutionRepository(null);
    await expect(
      updateInstitutionLogo(
        {
          institutionId: "missing",
          logoUrl: "https://cdn.example/logo.png",
          updatedBy: "owner_1",
        },
        { institutionRepository: repo as unknown as InstitutionRepository },
      ),
    ).rejects.toBeInstanceOf(InstitutionNotFoundError);
  });
});
