import { describe, expect, it } from "vitest";
import {
  createInstitutionPromoVideoUrl,
  parsePromoVideo,
  tryParsePromoVideo,
} from "./institution-promo-video";

describe("institution promo video", () => {
  it("normalizes YouTube watch, short, and youtu.be URLs", () => {
    expect(createInstitutionPromoVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
    expect(createInstitutionPromoVideoUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
    expect(createInstitutionPromoVideoUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
  });

  it("normalizes Vimeo URLs", () => {
    expect(createInstitutionPromoVideoUrl("https://vimeo.com/123456789")).toBe(
      "https://vimeo.com/123456789",
    );
    expect(createInstitutionPromoVideoUrl("https://player.vimeo.com/video/123456789")).toBe(
      "https://vimeo.com/123456789",
    );
  });

  it("builds embed URLs for preview", () => {
    expect(parsePromoVideo("https://youtu.be/dQw4w9WgXcQ").embedUrl).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
    expect(parsePromoVideo("https://vimeo.com/123456789").embedUrl).toBe(
      "https://player.vimeo.com/video/123456789",
    );
  });

  it("rejects non-video and unsupported hosts", () => {
    expect(() => createInstitutionPromoVideoUrl("https://example.com/video")).toThrow(/YouTube or Vimeo/);
    expect(() => createInstitutionPromoVideoUrl("https://www.youtube.com/@channel")).toThrow(
      /YouTube video/,
    );
    expect(() => createInstitutionPromoVideoUrl("not-a-url")).toThrow(/http\(s\)/);
  });

  it("treats empty as clear and tryParse returns null for invalid", () => {
    expect(createInstitutionPromoVideoUrl("")).toBeUndefined();
    expect(createInstitutionPromoVideoUrl("   ")).toBeUndefined();
    expect(tryParsePromoVideo("https://facebook.com/watch")).toBeNull();
  });
});
