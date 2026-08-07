import { describe, expect, it } from "vitest";
import { estimateDeliveryEtaMinutes, remainingDeliveryJobs } from "./delivery-eta";

describe("delivery ETA helpers", () => {
  it("computes remaining and ETA", () => {
    expect(
      remainingDeliveryJobs({ total: 20, sent: 5, failed: 1, bounced: 0 }),
    ).toBe(14);
    expect(estimateDeliveryEtaMinutes(14, 10)).toBe(2);
    expect(estimateDeliveryEtaMinutes(0, 10)).toBe(0);
    expect(estimateDeliveryEtaMinutes(1, 10)).toBe(1);
  });
});
