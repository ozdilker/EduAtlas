import { describe, expect, it } from "vitest";
import {
  buildParentPreferenceProfile,
  MIN_FAVORITES_FOR_AI,
} from "./ai-recommendations";

describe("buildParentPreferenceProfile", () => {
  it("requires enough favorites for AI gating constant", () => {
    expect(MIN_FAVORITES_FOR_AI).toBe(5);
  });

  it("summarizes preferred type and city from favorites", () => {
    const profile = buildParentPreferenceProfile([
      {
        id: "1",
        name: "A",
        typeLabel: "Anaokulu",
        city: "İstanbul",
        badges: { verified: true },
      },
      {
        id: "2",
        name: "B",
        typeLabel: "Anaokulu",
        city: "İstanbul",
        badges: { verified: true },
      },
      {
        id: "3",
        name: "C",
        typeLabel: "Kreş",
        city: "Ankara",
      },
      {
        id: "4",
        name: "D",
        typeLabel: "Anaokulu",
        city: "İstanbul",
      },
      {
        id: "5",
        name: "E",
        typeLabel: "Anaokulu",
        city: "İstanbul",
        badges: { premium: true },
      },
    ]);

    expect(profile.preferredTypes[0]).toBe("Anaokulu");
    expect(profile.preferredCities[0]).toBe("İstanbul");
    expect(profile.prefersVerified).toBe(true);
    expect(profile.summary.toLocaleLowerCase("tr-TR")).toContain("istanbul");
  });
});
