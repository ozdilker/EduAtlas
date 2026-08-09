import { InstitutionType } from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import {
  ADMIN_FREE_TEXT_SEARCH_LOCATION_REQUIRED_MESSAGE,
  hasAdminFreeTextSearchScope,
  isUnscopedAdminFreeTextQuery,
} from "./admin-free-text-search-scope";

describe("admin free-text search scope", () => {
  it("requires city, district, or primaryType", () => {
    expect(hasAdminFreeTextSearchScope({})).toBe(false);
    expect(hasAdminFreeTextSearchScope({ cityId: "istanbul" })).toBe(true);
    expect(hasAdminFreeTextSearchScope({ districtId: "istanbul-kadikoy" })).toBe(true);
    expect(hasAdminFreeTextSearchScope({ primaryType: InstitutionType.Kindergarten })).toBe(true);
  });

  it("detects unscoped free-text queries", () => {
    expect(isUnscopedAdminFreeTextQuery("kolej", {})).toBe(true);
    expect(isUnscopedAdminFreeTextQuery("kolej", { cityId: "istanbul" })).toBe(false);
    expect(isUnscopedAdminFreeTextQuery("", {})).toBe(false);
    expect(isUnscopedAdminFreeTextQuery(undefined, {})).toBe(false);
  });

  it("exposes a clear Turkish location-required message", () => {
    expect(ADMIN_FREE_TEXT_SEARCH_LOCATION_REQUIRED_MESSAGE).toContain("şehir");
  });
});

describe("admin free-text matching semantics (reference)", () => {
  function adminMatches(name: string, slug: string, query: string): boolean {
    const needle = query.toLocaleLowerCase("tr-TR");
    return (
      name.toLocaleLowerCase("tr-TR").includes(needle) ||
      slug.toLocaleLowerCase("tr-TR").includes(needle)
    );
  }

  it("matches name substring, slug substring, Turkish locale, multi-word, and kolej/koleji", () => {
    expect(adminMatches("ABC Koleji", "abc-koleji", "kolej")).toBe(true);
    expect(adminMatches("Fen Lisesi", "fen-lisesi", "fen lisesi")).toBe(true);
    expect(adminMatches("Özel Eğitim Merkezi", "ozel-egitim", "özel eğitim")).toBe(true);
    expect(adminMatches("Güneş Anaokulu", "gunes-anaokulu", "anaokulu")).toBe(true);
    expect(adminMatches("Other", "slug-with-kolej-token", "kolej")).toBe(true);
    expect(adminMatches("No Match", "no-match", "kolej")).toBe(false);
  });
});
