import { describe, expect, it } from "vitest";
import { NotFoundPageView, PublicLoadingState, PublicStatusBlock } from "./public-status";

describe("public status views", () => {
  it("exposes reusable status block props without crashing on import", () => {
    expect(typeof PublicStatusBlock).toBe("function");
    expect(typeof PublicLoadingState).toBe("function");
    expect(typeof NotFoundPageView).toBe("function");
  });
});
