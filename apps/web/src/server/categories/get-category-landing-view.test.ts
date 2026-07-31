import { InstitutionType } from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import {
  getCategoryLandingView,
  resolveInstitutionTypeFromCategorySlug,
} from "./get-category-landing-view";

describe("resolveInstitutionTypeFromCategorySlug", () => {
  it("maps public category slugs to InstitutionType", () => {
    expect(resolveInstitutionTypeFromCategorySlug("etut-merkezi")).toBe(
      InstitutionType.EtutMerkezi,
    );
    expect(resolveInstitutionTypeFromCategorySlug("ozel-okul")).toBe(InstitutionType.PrivateSchool);
    expect(resolveInstitutionTypeFromCategorySlug("dil-kursu")).toBe(
      InstitutionType.LanguageSchool,
    );
    expect(resolveInstitutionTypeFromCategorySlug("unknown-type")).toBeNull();
  });
});

describe("getCategoryLandingView", () => {
  it("returns null for unknown category slugs", async () => {
    await expect(getCategoryLandingView("not-a-type")).resolves.toBeNull();
  });

  it("returns a landing view for a known category slug", async () => {
    const landing = await getCategoryLandingView("ozel-okul");
    expect(landing).not.toBeNull();
    expect(landing?.slug).toBe("ozel-okul");
    expect(landing?.name).toBe("Özel Okul");
    expect(landing?.featuredInstitutions).toEqual([]);
  });
});
