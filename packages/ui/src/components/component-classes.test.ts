import { describe, expect, it } from "vitest";
import { getBadgeClassName } from "../components/badge-classes";
import { getButtonClassName } from "../components/button-classes";
import { getCardClassName } from "../components/card-classes";
import { getContainerClassName } from "../components/container-classes";
import { getInputClassName } from "../components/input-classes";
import { cn } from "../lib/cn";

describe("base component class helpers", () => {
  it("builds button classes from variant and size", () => {
    expect(getButtonClassName({ variant: "primary", size: "md" })).toBe(
      "ea-button ea-button--primary ea-button--md",
    );
  });

  it("marks input error state", () => {
    expect(getInputClassName({ error: true })).toBe("ea-input ea-input--error");
  });

  it("supports interactive cards", () => {
    expect(getCardClassName({ interactive: true, padding: "comfortable" })).toBe(
      "ea-card ea-card--comfortable ea-card--interactive",
    );
  });

  it("builds badge and container classes", () => {
    expect(getBadgeClassName({ tone: "success" })).toBe("ea-badge ea-badge--success");
    expect(getContainerClassName({ size: "xl" })).toBe("ea-container ea-container--xl");
  });

  it("joins class names with cn", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });
});
