import { createInstitutionFilters, type InstitutionRepository } from "@eduatlas/application";
import { InstitutionStatus } from "@eduatlas/domain";
import { createSeededInstitutionRepository } from "@eduatlas/firebase/server";
import { describe, expect, it } from "vitest";
import { getPublicInstitutionProfileBySlug } from "./get-public-institution-profile";

describe("getPublicInstitutionProfileBySlug", () => {
  it("returns a profile for published seed institutions", async () => {
    const repository = await createSeededInstitutionRepository();
    const result = await getPublicInstitutionProfileBySlug("kadikoy-marmara-koleji", repository);

    expect(result).not.toBeNull();
    expect(result?.profile.name).toBe("Kadıköy Marmara Koleji");
    expect(result?.profile.city).toBe("İstanbul");
    expect(result?.profile.district).toBe("Kadıköy");
    expect(result?.profile.contact.length).toBeGreaterThan(0);
  });

  it("returns null for missing or unpublished institutions", async () => {
    const repository = await createSeededInstitutionRepository();

    expect(await getPublicInstitutionProfileBySlug("does-not-exist", repository)).toBeNull();

    const drafts = await repository.list({
      page: 1,
      pageSize: 5,
      filters: createInstitutionFilters({ status: InstitutionStatus.Draft }),
    });
    const draft = drafts.items[0];
    if (draft) {
      expect(await getPublicInstitutionProfileBySlug(draft.slug, repository)).toBeNull();
    }
  });

  it("uses InstitutionRepository without Firestore in UI layer", async () => {
    const repository: InstitutionRepository = await createSeededInstitutionRepository();
    const result = await getPublicInstitutionProfileBySlug(
      "besiktas-minik-adimlar-anaokulu",
      repository,
    );
    expect(result?.institution.primaryType).toBeDefined();
    expect(result?.profile.typeLabel).toBe("Anaokulu");
  });
});
