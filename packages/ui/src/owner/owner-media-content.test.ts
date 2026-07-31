import { describe, expect, it } from "vitest";
import { formatMediaByteSize } from "./owner-media-content";

describe("owner media content helpers", () => {
  it("formats byte sizes for display", () => {
    expect(formatMediaByteSize(500)).toBe("500 B");
    expect(formatMediaByteSize(2048)).toBe("2 KB");
    expect(formatMediaByteSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});
