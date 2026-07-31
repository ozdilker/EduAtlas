import { describe, expect, it } from "vitest";
import {
  getInstitutionTypeFallbackImage,
  resolveInstitutionCardImageSrc,
} from "./institution-card-image-src";

describe("institution card image src", () => {
  it("maps type labels to category photography", () => {
    expect(getInstitutionTypeFallbackImage("Anaokulu")).toBe("/images/categories/anaokulu.png");
    expect(getInstitutionTypeFallbackImage("Dil Okulu")).toBe("/images/categories/dil-kursu.png");
    expect(getInstitutionTypeFallbackImage("dil-okulu")).toBe("/images/categories/dil-kursu.png");
  });

  it("prefers institution image over type fallback", () => {
    expect(
      resolveInstitutionCardImageSrc({
        imageSrc: "/media/cover.jpg",
        typeLabel: "Anaokulu",
      }),
    ).toBe("/media/cover.jpg");
  });

  it("falls back to type photography when image is missing", () => {
    expect(
      resolveInstitutionCardImageSrc({
        typeLabel: "Dershane",
      }),
    ).toBe("/images/categories/dershane.png");
  });
});
