import { describe, expect, it } from "vitest";
import {
  DEFAULT_WARMUP_STAGE_LIMITS,
  limitForStage,
  nextWarmupStage,
} from "./warmup-stage";
import {
  createDefaultWarmupSettings,
  currentWarmupLimit,
  elevateWarmupSettings,
} from "./warmup-settings";

describe("limitForStage", () => {
  it("maps stages 1–4 to 20/50/100/250", () => {
    expect(limitForStage(1)).toBe(20);
    expect(limitForStage(2)).toBe(50);
    expect(limitForStage(3)).toBe(100);
    expect(limitForStage(4)).toBe(250);
    expect(DEFAULT_WARMUP_STAGE_LIMITS[1]).toBe(20);
  });

  it("rejects invalid stage", () => {
    expect(() => limitForStage(0)).toThrow(/stage/i);
  });
});

describe("elevateWarmupSettings", () => {
  it("promotes stage and appends history", () => {
    const base = createDefaultWarmupSettings("2026-08-07T10:00:00.000Z");
    expect(currentWarmupLimit(base)).toBe(20);
    const next = elevateWarmupSettings(base, {
      now: "2026-08-07T11:00:00.000Z",
      by: "admin",
      snapshot: { recipientCount: 20, sent: 18, failed: 1, bounced: 1 },
    });
    expect(next?.stage).toBe(2);
    expect(currentWarmupLimit(next!)).toBe(50);
    expect(next?.history).toHaveLength(1);
    expect(next?.history[0]?.fromStage).toBe(1);
    expect(next?.history[0]?.toStage).toBe(2);
    expect(nextWarmupStage(4)).toBeNull();
    expect(
      elevateWarmupSettings(
        { ...base, stage: 4, history: [] },
        { now: "2026-08-07T12:00:00.000Z" },
      ),
    ).toBeNull();
  });
});
