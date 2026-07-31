import { describe, expect, it } from "vitest";
import { assertDefined } from "./assert-defined";

describe("assertDefined", () => {
  it("returns the value when defined", () => {
    expect(assertDefined("eduatlas", "missing")).toBe("eduatlas");
  });

  it("throws when the value is null", () => {
    expect(() => assertDefined(null, "value is required")).toThrow("value is required");
  });

  it("throws when the value is undefined", () => {
    expect(() => assertDefined(undefined, "value is required")).toThrow("value is required");
  });
});
