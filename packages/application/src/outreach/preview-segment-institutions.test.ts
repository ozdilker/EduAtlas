import {
  createCampaignSegment,
  createInstitution,
  InstitutionStatus,
  InstitutionType,
  InstitutionVerification,
} from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import type { InstitutionRepository } from "../institutions/institution-repository";
import { createInMemoryOutreachStores } from "./in-memory-outreach-stores";
import {
  countSegmentMatches,
  previewSegmentInstitutions,
} from "./preview-segment-institutions";

const NOW = "2026-08-07T12:00:00.000Z";

function memoryInstitutionRepo(
  institutions: ReturnType<typeof createInstitution>[],
): InstitutionRepository {
  return {
    async getById() {
      return null;
    },
    async getBySlug() {
      return null;
    },
    async list() {
      return {
        items: Object.freeze(institutions),
        page: 1,
        pageSize: Math.max(institutions.length, 1),
        totalItems: institutions.length,
        totalPages: institutions.length === 0 ? 0 : 1,
      };
    },
    async save(i) {
      return i;
    },
    async update(i) {
      return i;
    },
    async delete() {
      return;
    },
  };
}

describe("previewSegmentInstitutions", () => {
  it("counts and samples matching institutions without side effects", async () => {
    const stores = createInMemoryOutreachStores();
    await stores.segmentRepository.save(
      createCampaignSegment({
        id: "seg_preview",
        name: "Istanbul unclaimed",
        filters: {
          cityId: "istanbul",
          verification: "unclaimed",
          hasEmail: true,
        },
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );

    const institutions = [
      createInstitution({
        id: "inst_1",
        name: "A Anaokulu",
        slug: "a-anaokulu",
        primaryType: InstitutionType.Kindergarten,
        status: InstitutionStatus.Published,
        verification: InstitutionVerification.Unclaimed,
        location: { cityId: "istanbul", districtId: "kadikoy", address: "a" },
        contact: { email: "a@example.com" },
        socialLinks: {},
        shortDescription: "d",
        createdAt: NOW,
        updatedAt: NOW,
        publishedAt: NOW,
      }),
      createInstitution({
        id: "inst_2",
        name: "B Anaokulu",
        slug: "b-anaokulu",
        primaryType: InstitutionType.Kindergarten,
        status: InstitutionStatus.Published,
        verification: InstitutionVerification.Verified,
        location: { cityId: "istanbul", districtId: "kadikoy", address: "a" },
        contact: { email: "b@example.com" },
        socialLinks: {},
        shortDescription: "d",
        createdAt: NOW,
        updatedAt: NOW,
        publishedAt: NOW,
      }),
      createInstitution({
        id: "inst_3",
        name: "C Anaokulu",
        slug: "c-anaokulu",
        primaryType: InstitutionType.Kindergarten,
        status: InstitutionStatus.Published,
        verification: InstitutionVerification.Unclaimed,
        location: { cityId: "ankara", districtId: "cankaya", address: "a" },
        contact: { email: "c@example.com" },
        socialLinks: {},
        shortDescription: "d",
        createdAt: NOW,
        updatedAt: NOW,
        publishedAt: NOW,
      }),
    ];

    const institutionRepository = memoryInstitutionRepo(institutions);
    const preview = await previewSegmentInstitutions(
      { segmentId: "seg_preview", limit: 10 },
      { segmentRepository: stores.segmentRepository, institutionRepository },
    );
    expect(preview.matchCount).toBe(1);
    expect(preview.items).toHaveLength(1);
    expect(preview.items[0]?.name).toBe("A Anaokulu");

    const count = await countSegmentMatches("seg_preview", {
      segmentRepository: stores.segmentRepository,
      institutionRepository,
    });
    expect(count).toBe(1);
  });
});
