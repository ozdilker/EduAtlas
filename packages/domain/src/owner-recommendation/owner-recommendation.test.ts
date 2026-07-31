import { describe, expect, it } from "vitest";
import { createOwnerRecommendation, RecommendationPriority, RecommendationType } from "./index";

describe("OwnerRecommendation domain", () => {
  it("creates an immutable recommendation", () => {
    const recommendation = createOwnerRecommendation({
      id: "rec_1",
      institutionId: "seed_inst_ist_kolej_1",
      type: RecommendationType.UploadPhotos,
      priority: RecommendationPriority.Medium,
      ruleId: "rule_5",
      title: "Fotoğraf ekleyin",
      message: "Galeride henüz görsel yok.",
      createdAt: "2026-07-14T12:00:00.000Z",
    });

    expect(Object.isFrozen(recommendation)).toBe(true);
    expect(recommendation.type).toBe(RecommendationType.UploadPhotos);
    expect(recommendation.priority).toBe(RecommendationPriority.Medium);
  });

  it("rejects empty title", () => {
    expect(() =>
      createOwnerRecommendation({
        id: "rec_2",
        institutionId: "seed_inst_ist_kolej_1",
        type: RecommendationType.CompleteProfile,
        priority: RecommendationPriority.Low,
        ruleId: "rule_4",
        title: "  ",
        message: "Profili tamamlayın.",
        createdAt: "2026-07-14T12:00:00.000Z",
      }),
    ).toThrow(/title/);
  });
});
