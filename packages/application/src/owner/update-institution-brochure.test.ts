import {
  createPublishedInstitution,
  InstitutionType,
  InstitutionVerification,
} from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import {
  InstitutionNotFoundError,
  InstitutionProfileValidationError,
  type InstitutionRepository,
} from "../institutions";
import { removeInstitutionBrochure } from "./remove-institution-brochure";
import { updateInstitutionBrochure } from "./update-institution-brochure";

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

function published() {
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
    },
    shortDescription: "Kısa açıklama",
    publishedAt: "2026-07-01T10:00:00.000Z",
    createdAt: "2026-07-01T10:00:00.000Z",
    updatedAt: "2026-07-01T10:00:00.000Z",
  });
}

describe("updateInstitutionBrochure", () => {
  it("persists brochurePdfUrl only", async () => {
    const repo = new StubInstitutionRepository(published());
    const saved = await updateInstitutionBrochure(
      {
        institutionId: "seed_inst_ist_kolej_1",
        brochurePdfUrl: "https://firebasestorage.googleapis.com/v0/b/x/o/brochure.pdf",
        brochurePath: "institutions/seed_inst_ist_kolej_1/documents/brochure.pdf",
        updatedBy: "owner_demo",
        updatedAt: "2026-07-14T21:00:00.000Z",
      },
      { institutionRepository: repo as unknown as InstitutionRepository },
    );

    expect(saved.brochurePdfUrl).toBe(
      "https://firebasestorage.googleapis.com/v0/b/x/o/brochure.pdf",
    );
    expect(saved.updatedByUserId).toBe("owner_demo");
    expect(saved.updatedAt).toBe("2026-07-14T21:00:00.000Z");
  });

  it("throws when institution is missing", async () => {
    const repo = new StubInstitutionRepository(null);
    await expect(
      updateInstitutionBrochure(
        {
          institutionId: "missing",
          brochurePdfUrl: "https://example.com/a.pdf",
          updatedBy: "owner_demo",
        },
        { institutionRepository: repo as unknown as InstitutionRepository },
      ),
    ).rejects.toBeInstanceOf(InstitutionNotFoundError);
  });
});

describe("removeInstitutionBrochure", () => {
  it("clears brochurePdfUrl", async () => {
    const withPdf = createPublishedInstitution({
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
      contact: { phone: "+90 216 330 45 67" },
      shortDescription: "Kısa açıklama",
      brochurePdfUrl: "https://example.com/brochure.pdf",
      publishedAt: "2026-07-01T10:00:00.000Z",
      createdAt: "2026-07-01T10:00:00.000Z",
      updatedAt: "2026-07-01T10:00:00.000Z",
    });
    const repo = new StubInstitutionRepository(withPdf);
    const saved = await removeInstitutionBrochure(
      {
        institutionId: "seed_inst_ist_kolej_1",
        brochurePdfUrl: "https://example.com/brochure.pdf",
        updatedBy: "owner_demo",
      },
      { institutionRepository: repo as unknown as InstitutionRepository },
    );

    expect(saved.brochurePdfUrl).toBeUndefined();
  });

  it("throws when URL does not match", async () => {
    const withPdf = createPublishedInstitution({
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
      contact: { phone: "+90 216 330 45 67" },
      shortDescription: "Kısa açıklama",
      brochurePdfUrl: "https://example.com/brochure.pdf",
      publishedAt: "2026-07-01T10:00:00.000Z",
      createdAt: "2026-07-01T10:00:00.000Z",
      updatedAt: "2026-07-01T10:00:00.000Z",
    });
    const repo = new StubInstitutionRepository(withPdf);
    await expect(
      removeInstitutionBrochure(
        {
          institutionId: "seed_inst_ist_kolej_1",
          brochurePdfUrl: "https://example.com/other.pdf",
          updatedBy: "owner_demo",
        },
        { institutionRepository: repo as unknown as InstitutionRepository },
      ),
    ).rejects.toBeInstanceOf(InstitutionProfileValidationError);
  });
});
