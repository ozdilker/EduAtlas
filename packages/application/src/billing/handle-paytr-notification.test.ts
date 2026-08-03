import {
  BillingPeriod,
  createInstitutionSubscription,
  createPaymentOrder,
  PaymentOrderStatus,
  SubscriptionStatus,
  type InstitutionSubscription,
  type PaymentOrder,
} from "@eduatlas/domain";
import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { handlePaytrNotification } from "./handle-paytr-notification";
import type { PaymentOrderRepository } from "./payment-order-repository";
import type { InstitutionSubscriptionRepository } from "./subscription-repository";

const key = "merchant_key_example";
const salt = "merchant_salt_example";

function sign(merchantOid: string, status: string, totalAmount: string): string {
  return createHmac("sha256", key)
    .update(merchantOid + salt + status + totalAmount)
    .digest("base64");
}

function memoryOrders(seed: PaymentOrder[] = []): PaymentOrderRepository {
  const map = new Map(seed.map((o) => [o.merchantOid, o]));
  return {
    async getByMerchantOid(id) {
      return map.get(id) ?? null;
    },
    async save(order) {
      map.set(order.merchantOid, order);
      return order;
    },
  };
}

function memorySubs(): InstitutionSubscriptionRepository & {
  last: InstitutionSubscription | null;
} {
  const state: { last: InstitutionSubscription | null } = { last: null };
  return {
    get last() {
      return state.last;
    },
    async getByInstitutionId(id) {
      return state.last?.institutionId === id ? state.last : null;
    },
    async save(sub) {
      state.last = sub;
      return sub;
    },
  };
}

function pendingOrder(overrides: Partial<PaymentOrder> = {}): PaymentOrder {
  return createPaymentOrder({
    merchantOid: "eaorder1",
    institutionId: "inst_1",
    planCode: "pro",
    billingPeriod: BillingPeriod.Monthly,
    amountTry: 499,
    ...overrides,
  });
}

describe("handlePaytrNotification", () => {
  it("rejects bad hash without mutating order", async () => {
    const order = pendingOrder();
    const orders = memoryOrders([order]);
    const subs = memorySubs();
    const result = await handlePaytrNotification(
      {
        merchantOid: order.merchantOid,
        status: "success",
        totalAmount: "49900",
        hash: "bad",
        merchantSalt: salt,
        merchantKey: key,
      },
      { paymentOrders: orders, subscriptions: subs },
    );
    expect(result).toEqual({ kind: "bad_hash" });
    expect((await orders.getByMerchantOid(order.merchantOid))?.status).toBe(
      PaymentOrderStatus.Pending,
    );
    expect(subs.last).toBeNull();
  });

  it("returns order_not_found for unknown oid", async () => {
    const result = await handlePaytrNotification(
      {
        merchantOid: "missing",
        status: "success",
        totalAmount: "49900",
        hash: sign("missing", "success", "49900"),
        merchantSalt: salt,
        merchantKey: key,
      },
      { paymentOrders: memoryOrders(), subscriptions: memorySubs() },
    );
    expect(result).toEqual({ kind: "order_not_found" });
  });

  it("activates subscription on success", async () => {
    const order = pendingOrder();
    const orders = memoryOrders([order]);
    const subs = memorySubs();
    const now = new Date("2026-08-03T12:00:00.000Z");
    const result = await handlePaytrNotification(
      {
        merchantOid: order.merchantOid,
        status: "success",
        totalAmount: "49900",
        hash: sign(order.merchantOid, "success", "49900"),
        merchantSalt: salt,
        merchantKey: key,
        now,
      },
      { paymentOrders: orders, subscriptions: subs },
    );
    expect(result).toEqual({ kind: "ok" });
    expect((await orders.getByMerchantOid(order.merchantOid))?.status).toBe(
      PaymentOrderStatus.Paid,
    );
    expect(subs.last?.status).toBe(SubscriptionStatus.Active);
    expect(subs.last?.paymentProvider).toBe("paytr");
    expect(subs.last?.planCode).toBe("pro");
    expect(subs.last?.currentPeriodEnd).toBe("2026-09-02T12:00:00.000Z");
  });

  it("is idempotent for already paid orders", async () => {
    const order = pendingOrder({ status: PaymentOrderStatus.Paid });
    const orders = memoryOrders([order]);
    const subs = memorySubs();
    await subs.save(
      createInstitutionSubscription({
        id: "inst_1",
        institutionId: "inst_1",
        planCode: "pro",
        status: SubscriptionStatus.Active,
        paymentProvider: "paytr",
      }),
    );
    const before = subs.last;
    const result = await handlePaytrNotification(
      {
        merchantOid: order.merchantOid,
        status: "success",
        totalAmount: "49900",
        hash: sign(order.merchantOid, "success", "49900"),
        merchantSalt: salt,
        merchantKey: key,
      },
      { paymentOrders: orders, subscriptions: subs },
    );
    expect(result).toEqual({ kind: "ok" });
    expect(subs.last).toBe(before);
  });

  it("marks failed without changing subscription", async () => {
    const order = pendingOrder();
    const orders = memoryOrders([order]);
    const subs = memorySubs();
    const result = await handlePaytrNotification(
      {
        merchantOid: order.merchantOid,
        status: "failed",
        totalAmount: "49900",
        hash: sign(order.merchantOid, "failed", "49900"),
        merchantSalt: salt,
        merchantKey: key,
      },
      { paymentOrders: orders, subscriptions: subs },
    );
    expect(result).toEqual({ kind: "ok" });
    expect((await orders.getByMerchantOid(order.merchantOid))?.status).toBe(
      PaymentOrderStatus.Failed,
    );
    expect(subs.last).toBeNull();
  });

  it("rejects amount mismatch", async () => {
    const order = pendingOrder();
    const orders = memoryOrders([order]);
    const subs = memorySubs();
    const result = await handlePaytrNotification(
      {
        merchantOid: order.merchantOid,
        status: "success",
        totalAmount: "100",
        hash: sign(order.merchantOid, "success", "100"),
        merchantSalt: salt,
        merchantKey: key,
      },
      { paymentOrders: orders, subscriptions: subs },
    );
    expect(result).toEqual({ kind: "amount_mismatch" });
    expect(subs.last).toBeNull();
  });
});
