import { describe, expect, it } from "vitest";
import {
  getInstitutionCardClassName,
  getInstitutionCardEmptyClassName,
  getInstitutionCardSkeletonClassName,
} from "./institution-card-classes";
import {
  getInstitutionCardBadgeLabels,
  getInstitutionCardEmptyMessage,
  getSampleInstitutionCardData,
} from "./institution-card-content";

describe("institution card content helpers", () => {
  it("builds badge labels for verified, premium, and featured flags", () => {
    expect(
      getInstitutionCardBadgeLabels({ verified: true, premium: true, featured: true }),
    ).toEqual([
      { id: "verified", label: "Doğrulanmış", tone: "success" },
      { id: "premium", label: "Premium", tone: "warning" },
      { id: "featured", label: "Öne çıkan", tone: "info" },
    ]);
  });

  it("exposes sample presentation data without domain model fields", () => {
    const sample = getSampleInstitutionCardData();

    expect(sample.name).toBeTruthy();
    expect(sample.href.startsWith("/institutions/")).toBe(true);
    expect(sample.typeLabel).toBeTruthy();
    expect(sample.ratingPlaceholder).toBeTruthy();
  });

  it("exposes empty placeholder copy", () => {
    expect(getInstitutionCardEmptyMessage()).toContain("kurum");
  });
});

describe("institution card class helpers", () => {
  it("builds layout classes", () => {
    expect(getInstitutionCardClassName({ layout: "horizontal" })).toBe(
      "ea-institution-card ea-institution-card--horizontal",
    );
    expect(getInstitutionCardClassName({ layout: "compact" })).toContain(
      "ea-institution-card--compact",
    );
  });

  it("builds skeleton and empty classes", () => {
    expect(getInstitutionCardSkeletonClassName()).toContain("ea-institution-card--skeleton");
    expect(getInstitutionCardEmptyClassName()).toContain("ea-institution-card--empty");
  });
});
