import {
  createPublishedInstitution,
  createPublishedSearchDocument,
  type Institution,
  InstitutionStatus,
  InstitutionType,
  InstitutionVerification,
  institutionIdAsString,
} from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import { getHomeFeaturedInstitutions } from "./get-home-featured-institutions";
import type { InstitutionRepository } from "./institution-repository";
import {
  createInstitutionSearchQuery,
  type InstitutionSearchQuery,
} from "./institution-search-query";
import type { InstitutionSearchRepository } from "./institution-search-repository";
import { createInstitutionSearchResult } from "./institution-search-result";

const timestamps = {
  createdAt: "2026-07-14T10:00:00.000Z",
  updatedAt: "2026-07-14T12:00:00.000Z",
  publishedAt: "2026-07-14T11:00:00.000Z",
};

function buildInstitution(input: {
  id: string;
  name: string;
  slug: string;
  cityId: string;
  address?: string;
  shortDescription?: string;
  longDescription?: string;
  phone?: string;
  websiteUrl?: string;
}): Institution {
  return createPublishedInstitution({
    id: input.id,
    name: input.name,
    slug: input.slug,
    primaryType: InstitutionType.Kindergarten,
    verification: InstitutionVerification.Verified,
    location: {
      cityId: input.cityId,
      districtId: "kadikoy",
      address: input.address ?? "Caferağa Mah. No:1",
    },
    contact: {
      ...(input.phone ? { phone: input.phone } : {}),
    },
    socialLinks: {
      ...(input.websiteUrl ? { websiteUrl: input.websiteUrl } : {}),
    },
    shortDescription: input.shortDescription ?? "Kısa",
    ...(input.longDescription ? { longDescription: input.longDescription } : {}),
    ...timestamps,
  });
}

class MemoryInstitutionRepository implements Pick<InstitutionRepository, "getById"> {
  constructor(private readonly items: readonly Institution[]) {}

  async getById(id: { value: string }) {
    return this.items.find((item) => institutionIdAsString(item.id) === id.value) ?? null;
  }
}

class MemorySearchRepository implements InstitutionSearchRepository {
  constructor(private readonly items: readonly Institution[]) {}

  async search(query: InstitutionSearchQuery) {
    const cityId = query.filters.cityId;
    const filtered = this.items.filter((item) => {
      if (item.status !== InstitutionStatus.Published) return false;
      if (cityId && item.location.cityId !== cityId) return false;
      return true;
    });

    const docs = filtered.map((item) =>
      createPublishedSearchDocument({
        id: institutionIdAsString(item.id),
        slug: item.slug,
        name: item.name,
        primaryType: item.primaryType,
        cityId: item.location.cityId,
        citySlug: item.location.cityId,
        cityName: item.location.cityId,
        districtId: item.location.districtId,
        districtSlug: item.location.districtId,
        districtName: item.location.districtId,
        verification: item.verification,
        isPremium: item.isPremium,
        qualityScore: item.qualityScore,
        updatedAt: item.updatedAt,
      }),
    );

    return createInstitutionSearchResult({
      query: createInstitutionSearchQuery({
        page: query.page,
        pageSize: query.pageSize,
        filters: query.filters,
      }),
      items: docs,
      totalItems: docs.length,
    });
  }
}

describe("getHomeFeaturedInstitutions", () => {
  it("ranks by profile completeness descending and returns top 6", async () => {
    const rich = buildInstitution({
      id: "rich",
      slug: "zengin-profil",
      name: "Zengin Profil",
      cityId: "istanbul",
      shortDescription: "Kısa açıklama",
      longDescription: "Uzun açıklama metni",
      phone: "+90 212 000 00 00",
      websiteUrl: "https://example.com",
    });
    const thin = buildInstitution({
      id: "thin",
      slug: "zayif-profil",
      name: "Zayıf Profil",
      cityId: "istanbul",
      address: "X",
    });
    const mid = buildInstitution({
      id: "mid",
      slug: "orta-profil",
      name: "Orta Profil",
      cityId: "istanbul",
      phone: "+90 212 111 11 11",
      websiteUrl: "https://mid.example.com",
    });

    const items = [thin, mid, rich];
    const result = await getHomeFeaturedInstitutions(
      { cityId: "istanbul", limit: 6 },
      {
        institutionSearchRepository: new MemorySearchRepository(items),
        institutionRepository: new MemoryInstitutionRepository(items) as unknown as InstitutionRepository,
      },
    );

    expect(result).toHaveLength(3);
    expect(result[0]?.document.id).toBe("rich");
    expect(result[1]?.document.id).toBe("mid");
    expect(result[2]?.document.id).toBe("thin");
    expect(result[0]!.completenessPercentage).toBeGreaterThan(result[1]!.completenessPercentage);
    expect(result[1]!.completenessPercentage).toBeGreaterThan(result[2]!.completenessPercentage);
  });

  it("filters by cityId before ranking", async () => {
    const istanbul = buildInstitution({
      id: "ist_1",
      slug: "istanbul-kurum",
      name: "İstanbul Kurum",
      cityId: "istanbul",
      phone: "+90 212 000 00 00",
    });
    const ankara = buildInstitution({
      id: "ank_1",
      slug: "ankara-kurum",
      name: "Ankara Kurum",
      cityId: "ankara",
      phone: "+90 312 000 00 00",
      websiteUrl: "https://ankara.example.com",
      shortDescription: "Kısa",
      longDescription: "Uzun",
    });

    const items = [istanbul, ankara];
    const result = await getHomeFeaturedInstitutions(
      { cityId: "ankara", limit: 6 },
      {
        institutionSearchRepository: new MemorySearchRepository(items),
        institutionRepository: new MemoryInstitutionRepository(items) as unknown as InstitutionRepository,
      },
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.document.id).toBe("ank_1");
  });
});
