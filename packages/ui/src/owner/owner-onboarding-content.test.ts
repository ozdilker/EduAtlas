import { describe, expect, it } from "vitest";
import {
  buildOwnerOnboardingSteps,
  createOwnerOnboardingViewData,
} from "./owner-onboarding-content";
import type { OwnerProfileCompletenessView } from "./owner-portal-content";

function completenessFixture(
  overrides: Partial<OwnerProfileCompletenessView> = {},
): OwnerProfileCompletenessView {
  return {
    title: "Profil tamamlanma",
    overallPercentage: 40,
    nextActionHint: "Web sitesi ekleyin.",
    completedCount: 2,
    missingCount: 3,
    missingSectionLabels: ["Logo", "Galeri", "Web sitesi"],
    sections: [
      {
        id: "logo",
        label: "Logo",
        completed: false,
        hint: "Logo yükleyin.",
        weight: 5,
      },
      {
        id: "gallery",
        label: "Galeri",
        completed: false,
        hint: "Galeri ekleyin.",
        weight: 15,
      },
      {
        id: "website",
        label: "Web sitesi",
        completed: false,
        hint: "Web sitesi ekleyin.",
        weight: 10,
      },
      {
        id: "description",
        label: "Açıklama",
        completed: true,
        hint: "Açıklamayı zenginleştirin.",
        weight: 15,
      },
      {
        id: "contact",
        label: "İletişim",
        completed: true,
        hint: "İletişim ekleyin.",
        weight: 15,
      },
    ],
    profileHref: "/owner/profile",
    ...overrides,
  };
}

describe("owner onboarding content", () => {
  it("builds checklist steps from completeness sections", () => {
    const steps = buildOwnerOnboardingSteps(completenessFixture());

    expect(steps.map((step) => step.id)).toEqual([
      "welcome",
      "logo",
      "gallery",
      "website",
      "description",
      "contact",
      "ready",
    ]);
    expect(steps.find((step) => step.id === "welcome")?.completed).toBe(true);
    expect(steps.find((step) => step.id === "description")?.completed).toBe(true);
    expect(steps.find((step) => step.id === "website")?.href).toBe(
      "/owner/profile#owner-profile-website",
    );
    expect(steps.find((step) => step.id === "gallery")?.placeholder).toBe(true);
    expect(steps.find((step) => step.id === "ready")?.completed).toBe(false);
  });

  it("marks ready when actionable sections are complete", () => {
    const data = createOwnerOnboardingViewData({
      institutionName: "Demo Koleji",
      publicProfileHref: "/institutions/demo",
      profileCompleteness: completenessFixture({
        overallPercentage: 100,
        sections: ["logo", "gallery", "website", "description", "contact"].map((id) => ({
          id,
          label: id,
          completed: true,
          hint: "ok",
          weight: 10,
        })),
      }),
      recommendations: {
        title: "Öneriler",
        description: "Test",
        count: 0,
        items: [],
      },
    });

    expect(data.isReady).toBe(true);
    expect(data.actionableCompletedCount).toBe(5);
    expect(data.steps.find((step) => step.id === "ready")?.completed).toBe(true);
  });
});
