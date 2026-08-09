import { describe, expect, it } from "vitest";
import {
  decodePublishedBrowseCursor,
  encodePublishedBrowseCursor,
} from "./published-browse-cursor";

describe("published-browse-cursor", () => {
  it("round-trips qualityScore and id", () => {
    const encoded = encodePublishedBrowseCursor({ qualityScore: 88, id: "inst_1" });
    expect(decodePublishedBrowseCursor(encoded)).toEqual({
      qualityScore: 88,
      id: "inst_1",
    });
  });

  it("returns null for malformed cursors", () => {
    expect(decodePublishedBrowseCursor("")).toBeNull();
    expect(decodePublishedBrowseCursor("not-base64")).toBeNull();
    expect(decodePublishedBrowseCursor(undefined)).toBeNull();
  });
});
