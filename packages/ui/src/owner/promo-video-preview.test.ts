import { describe, expect, it } from "vitest";
import { parsePromoVideoPreview } from "./promo-video-preview";

describe("parsePromoVideoPreview", () => {
  it("parses YouTube and Vimeo embed targets", () => {
    expect(parsePromoVideoPreview("https://youtu.be/dQw4w9WgXcQ")).toEqual({
      provider: "youtube",
      embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    });
    expect(parsePromoVideoPreview("https://vimeo.com/123456789")).toEqual({
      provider: "vimeo",
      embedUrl: "https://player.vimeo.com/video/123456789",
    });
  });

  it("returns null for invalid or empty values", () => {
    expect(parsePromoVideoPreview("")).toBeNull();
    expect(parsePromoVideoPreview("https://example.com/x")).toBeNull();
  });
});
