import {
  createPublishedInstitution,
  INSTITUTION_GALLERY_MAX_IMAGES,
  InstitutionType,
  InstitutionVerification,
} from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import {
  InstitutionNotFoundError,
  InstitutionProfileValidationError,
  type InstitutionRepository,
} from "../institutions";
import { appendInstitutionGalleryImages } from "./append-institution-gallery-images";

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

function published(galleryImages?: readonly string[]) {
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
    logoUrl: "https://cdn.example/logo.png",
    coverImageUrl: "https://cdn.example/cover.jpg",
    galleryImages,
    publishedAt: "2026-07-01T10:00:00.000Z",
    createdAt: "2026-07-01T10:00:00.000Z",
    updatedAt: "2026-07-01T10:00:00.000Z",
  });
}

describe("appendInstitutionGalleryImages", () => {
  it("appends URLs without changing logo or cover", async () => {
    const repo = new StubInstitutionRepository(published(["https://cdn.example/g1.jpg"]));
    const saved = await appendInstitutionGalleryImages(
      {
        institutionId: "seed_inst_ist_kolej_1",
        imageUrls: ["https://cdn.example/g2.jpg", "https://cdn.example/g3.jpg"],
        updatedBy: "owner_1",
        updatedAt: "2026-07-20T12:00:00.000Z",
      },
      { institutionRepository: repo as unknown as InstitutionRepository },
    );

    expect(saved.galleryImages).toEqual([
      "https://cdn.example/g1.jpg",
      "https://cdn.example/g2.jpg",
      "https://cdn.example/g3.jpg",
    ]);
    expect(saved.logoUrl).toBe("https://cdn.example/logo.png");
    expect(saved.coverImageUrl).toBe("https://cdn.example/cover.jpg");
    expect(saved.updatedByUserId).toBe("owner_1");
  });

  it("rejects when gallery is full", async () => {
    const full = Array.from(
      { length: INSTITUTION_GALLERY_MAX_IMAGES },
      (_, index) => `https://cdn.example/g${index}.jpg`,
    );
    const repo = new StubInstitutionRepository(published(full));

    await expect(
      appendInstitutionGalleryImages(
        {
          institutionId: "seed_inst_ist_kolej_1",
          imageUrls: ["https://cdn.example/extra.jpg"],
          updatedBy: "owner_1",
        },
        { institutionRepository: repo as unknown as InstitutionRepository },
      ),
    ).rejects.toBeInstanceOf(InstitutionProfileValidationError);
  });

  it("throws when institution is missing", async () => {
    const repo = new StubInstitutionRepository(null);
    await expect(
      appendInstitutionGalleryImages(
        {
          institutionId: "missing",
          imageUrls: ["https://cdn.example/g1.jpg"],
          updatedBy: "owner_1",
        },
        { institutionRepository: repo as unknown as InstitutionRepository },
      ),
    ).rejects.toBeInstanceOf(InstitutionNotFoundError);
  });
});
