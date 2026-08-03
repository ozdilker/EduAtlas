import {
  BillingPeriod,
  createBillingPlan,
  type PaymentOrder,
} from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import type { BillingPlanRepository } from "./billing-plan-repository";
import type { PaymentOrderRepository } from "./payment-order-repository";
import type { PaytrTokenGateway, PaytrTokenRequest } from "./paytr-token-gateway";
import { startPaytrCheckout } from "./start-paytr-checkout";

function memoryPlans(): BillingPlanRepository {
  const pro = createBillingPlan({
    id: "plan_pro",
    code: "pro",
    name: "Pro",
    monthlyPriceTry: 499,
    yearlyPriceTry: 4990,
    entitlements: {},
  });
  const premium = createBillingPlan({
    id: "plan_premium",
    code: "premium",
    name: "Premium",
    monthlyPriceTry: 999,
    yearlyPriceTry: 9990,
    entitlements: {},
  });
  const free = createBillingPlan({
    id: "plan_free",
    code: "free",
    name: "Free",
    monthlyPriceTry: 0,
    yearlyPriceTry: 0,
    entitlements: {},
  });
  const map = new Map([
    [pro.code, pro],
    [premium.code, premium],
    [free.code, free],
  ]);
  return {
    async listAll() {
      return [...map.values()];
    },
    async listActive() {
      return [...map.values()].filter((p) => p.active);
    },
    async getByCode(code) {
      return map.get(code.trim().toLowerCase()) ?? null;
    },
    async save(plan) {
      map.set(plan.code, plan);
      return plan;
    },
  };
}

function memoryOrders(): PaymentOrderRepository & { items: PaymentOrder[] } {
  const map = new Map<string, PaymentOrder>();
  return {
    get items() {
      return [...map.values()];
    },
    async getByMerchantOid(id) {
      return map.get(id) ?? null;
    },
    async save(order) {
      map.set(order.merchantOid, order);
      return order;
    },
  };
}

describe("startPaytrCheckout", () => {
  it("rejects free plan", async () => {
    await expect(
      startPaytrCheckout(
        {
          institutionId: "inst_1",
          planCode: "free",
          billingPeriod: BillingPeriod.Monthly,
          email: "a@b.com",
          userIp: "1.1.1.1",
          merchantOkUrl: "https://example.com/ok",
          merchantFailUrl: "https://example.com/fail",
        },
        {
          plans: memoryPlans(),
          paymentOrders: memoryOrders(),
          paytr: {
            async getIframeToken() {
              return "tok";
            },
          },
        },
      ),
    ).rejects.toThrow(/not purchasable/i);
  });

  it("creates pending order and returns token for monthly pro", async () => {
    const orders = memoryOrders();
    let lastRequest: PaytrTokenRequest | undefined;
    const paytr: PaytrTokenGateway = {
      async getIframeToken(request) {
        lastRequest = request;
        return "iframe_token_abc";
      },
    };
    const result = await startPaytrCheckout(
      {
        institutionId: "inst_1",
        planCode: "pro",
        billingPeriod: BillingPeriod.Monthly,
        email: "owner@school.com",
        userIp: "1.2.3.4",
        merchantOkUrl: "https://eduatlas.com.tr/owner/billing/result?status=ok",
        merchantFailUrl: "https://eduatlas.com.tr/owner/billing/result?status=fail",
      },
      {
        plans: memoryPlans(),
        paymentOrders: orders,
        paytr,
        createOid: () => "eafixedoid1",
      },
    );
    expect(result).toEqual({ merchantOid: "eafixedoid1", iframeToken: "iframe_token_abc" });
    expect(orders.items).toHaveLength(1);
    expect(orders.items[0]?.amountKurus).toBe(49900);
    expect(lastRequest?.paymentAmountKurus).toBe(49900);
    expect(lastRequest?.email).toBe("owner@school.com");
  });

  it("uses yearly price when period is yearly", async () => {
    const orders = memoryOrders();
    let amount = 0;
    await startPaytrCheckout(
      {
        institutionId: "inst_1",
        planCode: "premium",
        billingPeriod: BillingPeriod.Yearly,
        email: "a@b.com",
        userIp: "1.1.1.1",
        merchantOkUrl: "https://example.com/ok",
        merchantFailUrl: "https://example.com/fail",
      },
      {
        plans: memoryPlans(),
        paymentOrders: orders,
        paytr: {
          async getIframeToken(req) {
            amount = req.paymentAmountKurus;
            return "tok";
          },
        },
        createOid: () => "eayearly1",
      },
    );
    expect(amount).toBe(999000);
    expect(orders.items[0]?.amountTry).toBe(9990);
  });

  it("keeps pending order when gateway fails", async () => {
    const orders = memoryOrders();
    await expect(
      startPaytrCheckout(
        {
          institutionId: "inst_1",
          planCode: "pro",
          billingPeriod: BillingPeriod.Monthly,
          email: "a@b.com",
          userIp: "1.1.1.1",
          merchantOkUrl: "https://example.com/ok",
          merchantFailUrl: "https://example.com/fail",
        },
        {
          plans: memoryPlans(),
          paymentOrders: orders,
          paytr: {
            async getIframeToken() {
              throw new Error("PayTR down");
            },
          },
          createOid: () => "eafail1",
        },
      ),
    ).rejects.toThrow(/PayTR down/);
    expect(orders.items[0]?.status).toBe("pending");
  });
});
