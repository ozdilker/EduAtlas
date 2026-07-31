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
import { reorderInstitutionGalleryImages } from "./reorder-institution-gallery-images";

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
    galleryImages,
    publishedAt: "2026-07-01T10:00:00.000Z",
    createdAt: "2026-07-01T10:00:00.000Z",
    updatedAt: "2026-07-01T10:00:00.000Z",
  });
}

describe("reorderInstitutionGalleryImages", () => {
  it("persists a new order for the same URLs", async () => {
    const repo = new StubInstitutionRepository(
      published([
        "https://cdn.example/g1.jpg",
        "https://cdn.example/g2.jpg",
        "https://cdn.example/g3.jpg",
      ]),
    );

    const saved = await reorderInstitutionGalleryImages(
      {
        institutionId: "seed_inst_ist_kolej_1",
        imageUrls: [
          "https://cdn.example/g3.jpg",
          "https://cdn.example/g1.jpg",
          "https://cdn.example/g2.jpg",
        ],
        updatedBy: "owner_1",
        updatedAt: "2026-07-20T12:00:00.000Z",
      },
      { institutionRepository: repo as unknown as InstitutionRepository },
    );

    expect(saved.galleryImages).toEqual([
      "https://cdn.example/g3.jpg",
      "https://cdn.example/g1.jpg",
      "https://cdn.example/g2.jpg",
    ]);
    expect(saved.updatedAt).toBe("2026-07-20T12:00:00.000Z");
  });

  it("rejects orders that change the URL set", async () => {
    const repo = new StubInstitutionRepository(
      published(["https://cdn.example/g1.jpg", "https://cdn.example/g2.jpg"]),
    );

    await expect(
      reorderInstitutionGalleryImages(
        {
          institutionId: "seed_inst_ist_kolej_1",
          imageUrls: ["https://cdn.example/g1.jpg", "https://cdn.example/other.jpg"],
          updatedBy: "owner_1",
        },
        { institutionRepository: repo as unknown as InstitutionRepository },
      ),
    ).rejects.toBeInstanceOf(InstitutionProfileValidationError);
  });

  it("throws when institution is missing", async () => {
    const repo = new StubInstitutionRepository(null);
    await expect(
      reorderInstitutionGalleryImages(
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
