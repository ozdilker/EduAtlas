import { describe, expect, it } from "vitest";
import { computeCampaignQualityScore } from "./campaign-quality-score";

describe("computeCampaignQualityScore", () => {
  it("scores a strong personalized claim invitation highly", () => {
    const result = computeCampaignQualityScore({
      subject: "{{institutionName}} için EduAtlas kurum paneli",
      preheader: "Velilerden gelen talepleri kaçırmayın — kurumunuzu ücretsiz sahiplenin.",
      bodyLines: [
        "EduAtlas, velilerin eğitim kurumu aradığı platformdur. {{institutionName}} profiliniz burada listeleniyor olabilir.",
        "Kurum panelinden bilgilerinizi güncelleyin.",
      ],
      hasCta: true,
      hasTemplate: true,
    });
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.factors.some((f) => f.id === "personalization" && f.points === 15)).toBe(
      true,
    );
  });

  it("penalizes spam words and missing personalization", () => {
    const result = computeCampaignQualityScore({
      subject: "Bedava kazanç !!!",
      preheader: "tıkla hemen",
      bodyLines: ["kısa"],
      hasCta: false,
      hasTemplate: false,
    });
    expect(result.score).toBeLessThan(40);
    expect(result.factors.find((f) => f.id === "spam")?.points).toBe(0);
    expect(result.factors.find((f) => f.id === "personalization")?.points).toBe(0);
  });

  it("clamps to 0–100", () => {
    const result = computeCampaignQualityScore({
      subject: "",
      preheader: "",
      bodyLines: [],
      hasCta: false,
      hasTemplate: false,
    });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
