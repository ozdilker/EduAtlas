import { describe, expect, it } from "vitest";
import { leadSubmitFailureState, leadSubmitSuccessState } from "./lead-submit-result";

describe("lead submit contact unlock result", () => {
  it("keeps the lead successful when unlock cannot be granted", () => {
    const state = leadSubmitSuccessState(false);
    expect(state.ok).toBe(true);
    expect(state.contactUnlocked).toBe(false);
    expect(state.message).toMatch(/Talebiniz alındı/);
    expect(state.message).toMatch(/açılamadı/);
    expect(state.message).not.toMatch(/görüntülenebilir/);
  });

  it("marks contact unlocked only when the grant succeeds", () => {
    const state = leadSubmitSuccessState(true);
    expect(state.ok).toBe(true);
    expect(state.contactUnlocked).toBe(true);
    expect(state.message).toMatch(/görüntülenebilir/);
  });

  it("does not unlock contact when the lead fails", () => {
    const state = leadSubmitFailureState("Talebiniz kaydedilemedi.");
    expect(state.ok).toBe(false);
    expect(state.contactUnlocked).toBe(false);
  });
});