import { describe, expect, it } from "vitest";
import {
  createMerchantOid,
  createPaymentOrder,
  PaymentOrderStatus,
} from "./payment-order";
import { computeSubscriptionPeriodEnd } from "./subscription-period";
import { BillingPeriod } from "./subscription";

describe("createPaymentOrder", () => {
  it("freezes a pending order with kurus = try * 100", () => {
    const order = createPaymentOrder({
      merchantOid: "ea123abc",
      institutionId: "inst_1",
      planCode: "pro",
      billingPeriod: BillingPeriod.Monthly,
      amountTry: 499,
    });
    expect(order.status).toBe(PaymentOrderStatus.Pending);
    expect(order.amountKurus).toBe(49900);
  });

  it("rejects free plan", () => {
    expect(() =>
      createPaymentOrder({
        merchantOid: "ea1",
        institutionId: "inst_1",
        planCode: "free",
        billingPeriod: BillingPeriod.Monthly,
        amountTry: 0,
      }),
    ).toThrow(/pro|premium/i);
  });
});

describe("createMerchantOid", () => {
  it("is alphanumeric and unique-ish", () => {
    const a = createMerchantOid();
    const b = createMerchantOid();
    expect(a).toMatch(/^ea[a-zA-Z0-9]+$/);
    expect(a).not.toBe(b);
  });
});

describe("computeSubscriptionPeriodEnd", () => {
  it("adds 30 days for monthly and 365 for yearly", () => {
    const start = new Date("2026-08-03T12:00:00.000Z");
    expect(computeSubscriptionPeriodEnd(start, BillingPeriod.Monthly).toISOString()).toBe(
      "2026-09-02T12:00:00.000Z",
    );
    expect(computeSubscriptionPeriodEnd(start, BillingPeriod.Yearly).toISOString()).toBe(
      "2027-08-03T12:00:00.000Z",
    );
  });
});
