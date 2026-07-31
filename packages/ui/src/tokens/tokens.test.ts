import { describe, expect, it } from "vitest";
import { colors, containers, radius, semanticColors, shadows, space } from "./index";

describe("design tokens", () => {
  it("exposes the primary teal palette from DESIGN-SYSTEM.md", () => {
    expect(colors.primary[600]).toBe("#0F6B6B");
    expect(colors.primary[700]).toBe("#0B5353");
    expect(semanticColors.background).toBe("#F7F8FA");
  });

  it("uses a 4px spacing grid", () => {
    expect(space[1]).toBe("4px");
    expect(space[4]).toBe("16px");
    expect(space[24]).toBe("96px");
  });

  it("exposes radius and shadow scales", () => {
    expect(radius.md).toBe("10px");
    expect(shadows.none).toBe("none");
    expect(shadows.sm).toContain("rgba");
  });

  it("exposes container max widths", () => {
    expect(containers.lg).toBe("1024px");
    expect(containers["2xl"]).toBe("1440px");
  });
});
