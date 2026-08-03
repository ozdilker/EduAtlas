# PayTR iFrame Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable one-time Pro/Premium (monthly/yearly) checkout via PayTR iFrame API, activating `InstitutionSubscription` only from the verified notification callback.

**Architecture:** Domain `PaymentOrder` + PayTR HMAC helpers; application use cases `startPaytrCheckout` / `handlePaytrNotification`; Firestore `payment_orders`; web adapter for get-token HTTP + owner modal iframe + public callback route. Spec: `docs/superpowers/specs/2026-08-03-paytr-iframe-checkout-design.md`.

**Tech Stack:** TypeScript monorepo (`packages/domain`, `packages/application`, `packages/firebase`, `apps/web`), Node `crypto` HMAC-SHA256, Vitest, Next.js App Router server actions + Route Handlers, Firestore Admin.

## Global Constraints

- One-time payment only; no recurring / card storage / installments (`no_installment=1`, `max_installment=0`).
- Activate subscription **only** on verified PayTR notification; ok/fail redirect pages are informational.
- Amounts to PayTR in **kuruş** (`amountTry * 100`); currency `TL`.
- Secrets server-only: `PAYTR_MERCHANT_ID`, `PAYTR_MERCHANT_KEY`, `PAYTR_MERCHANT_SALT`; never log key/salt.
- Checkout disabled when PayTR credentials missing (keep coming-soon message).
- Free plan is not purchasable; paid plan replaces existing subscription (no proration).
- Prefer `fetch` + form body over deprecated `request` package from PayTR samples.
- Commit only when the user asks (or when explicitly executing this plan’s commit steps with user approval).

---

## File map

| Area | Files |
|------|--------|
| Domain | `packages/domain/src/billing/payment-order.ts`, period helper, exports |
| Application | `payment-order-repository.ts`, `paytr-crypto.ts`, `start-paytr-checkout.ts`, `handle-paytr-notification.ts`, tests |
| Firebase | `firestore-payment-order-repository.ts`, billing index + server exports |
| Config / web env | `apps/web/src/server/billing/paytr-env.ts`, `paytr-client.ts`, repository wiring |
| Owner actions | `apps/web/src/server/owner/start-paytr-checkout-action.ts` |
| Routes | `apps/web/src/app/api/billing/paytr/callback/route.ts`, `apps/web/src/app/owner/billing/result/page.tsx` |
| UI | `packages/ui/src/owner/owner-billing-page.tsx`, `owner-portal.css`, view data |

---

### Task 1: Domain — PaymentOrder + period end helper

**Files:**
- Create: `packages/domain/src/billing/payment-order.ts`
- Create: `packages/domain/src/billing/subscription-period.ts`
- Modify: `packages/domain/src/billing/index.ts`
- Test: `packages/domain/src/billing/payment-order.test.ts`

**Interfaces:**
- Consumes: `BillingPeriod` from `subscription.ts`
- Produces: `PaymentOrder`, `PaymentOrderStatus`, `createPaymentOrder`, `createMerchantOid`, `computeSubscriptionPeriodEnd`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { BillingPeriod } from "./subscription";
import {
  createMerchantOid,
  createPaymentOrder,
  PaymentOrderStatus,
} from "./payment-order";
import { computeSubscriptionPeriodEnd } from "./subscription-period";

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=@eduatlas/domain -- payment-order`
Expected: FAIL (module not found)

- [ ] **Step 3: Write minimal implementation**

`payment-order.ts`:

```ts
import type { BillingPeriod } from "./subscription";

export const PaymentOrderStatus = {
  Pending: "pending",
  Paid: "paid",
  Failed: "failed",
} as const;
export type PaymentOrderStatus =
  (typeof PaymentOrderStatus)[keyof typeof PaymentOrderStatus];

export type PaymentOrder = Readonly<{
  readonly merchantOid: string;
  readonly institutionId: string;
  readonly planCode: string;
  readonly billingPeriod: BillingPeriod;
  readonly amountTry: number;
  readonly amountKurus: number;
  readonly status: PaymentOrderStatus;
  readonly paytrStatus?: string;
  readonly totalAmountKurus?: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}>;

export type CreatePaymentOrderInput = {
  readonly merchantOid: string;
  readonly institutionId: string;
  readonly planCode: string;
  readonly billingPeriod: BillingPeriod;
  readonly amountTry: number;
  readonly status?: PaymentOrderStatus;
  readonly paytrStatus?: string;
  readonly totalAmountKurus?: number;
  readonly createdAt?: string;
  readonly updatedAt?: string;
};

const PAID_CODES = new Set(["pro", "premium"]);

export function createPaymentOrder(input: CreatePaymentOrderInput): PaymentOrder {
  const merchantOid = input.merchantOid.trim();
  const institutionId = input.institutionId.trim();
  const planCode = input.planCode.trim().toLowerCase();
  if (!merchantOid) throw new Error("PaymentOrder.merchantOid is required.");
  if (!/^[a-zA-Z0-9]+$/.test(merchantOid)) {
    throw new Error("PaymentOrder.merchantOid must be alphanumeric.");
  }
  if (!institutionId) throw new Error("PaymentOrder.institutionId is required.");
  if (!PAID_CODES.has(planCode)) {
    throw new Error("PaymentOrder.planCode must be pro or premium.");
  }
  const amountTry = Math.floor(input.amountTry);
  if (amountTry <= 0) throw new Error("PaymentOrder.amountTry must be positive.");
  const now = new Date().toISOString();
  return Object.freeze({
    merchantOid,
    institutionId,
    planCode,
    billingPeriod: input.billingPeriod,
    amountTry,
    amountKurus: amountTry * 100,
    status: input.status ?? PaymentOrderStatus.Pending,
    ...(input.paytrStatus ? { paytrStatus: input.paytrStatus } : {}),
    ...(typeof input.totalAmountKurus === "number"
      ? { totalAmountKurus: input.totalAmountKurus }
      : {}),
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  });
}

/** PayTR merchant_oid: alphanumeric, unique per attempt. */
export function createMerchantOid(now = Date.now(), random = Math.random): string {
  const rand = Math.floor(random() * 1e9)
    .toString(36)
    .replace(/[^a-z0-9]/gi, "");
  return `ea${now.toString(36)}${rand}`;
}
```

`subscription-period.ts`:

```ts
import { BillingPeriod } from "./subscription";

export function computeSubscriptionPeriodEnd(
  start: Date,
  period: BillingPeriod,
): Date {
  const end = new Date(start.getTime());
  if (period === BillingPeriod.Yearly) {
    end.setUTCDate(end.getUTCDate() + 365);
  } else {
    end.setUTCDate(end.getUTCDate() + 30);
  }
  return end;
}
```

Export both from `packages/domain/src/billing/index.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --workspace=@eduatlas/domain -- payment-order`
Expected: PASS

- [ ] **Step 5: Commit** (only if user requested commits)

```bash
git add packages/domain/src/billing/payment-order.ts packages/domain/src/billing/subscription-period.ts packages/domain/src/billing/payment-order.test.ts packages/domain/src/billing/index.ts
git commit -m "$(cat <<'EOF'
Add PaymentOrder domain model for PayTR checkout.

EOF
)"
```

---

### Task 2: PayTR crypto helpers

**Files:**
- Create: `packages/application/src/billing/paytr-crypto.ts`
- Test: `packages/application/src/billing/paytr-crypto.test.ts`
- Modify: `packages/application/src/billing/index.ts` (re-export later with use cases)

**Interfaces:**
- Consumes: Node `crypto`
- Produces: `buildPaytrUserBasket`, `buildPaytrGetTokenHash`, `verifyPaytrNotificationHash`

- [ ] **Step 1: Write the failing test**

```ts
import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  buildPaytrGetTokenHash,
  buildPaytrUserBasket,
  verifyPaytrNotificationHash,
} from "./paytr-crypto";

describe("paytr-crypto", () => {
  const key = "merchant_key_example";
  const salt = "merchant_salt_example";

  it("builds base64 basket JSON", () => {
    const basket = buildPaytrUserBasket("Pro Aylık", 499);
    const decoded = JSON.parse(Buffer.from(basket, "base64").toString("utf8"));
    expect(decoded).toEqual([["Pro Aylık", "499.00", 1]]);
  });

  it("matches HMAC for get-token payload", () => {
    const hash = buildPaytrGetTokenHash({
      merchantId: "123",
      userIp: "1.2.3.4",
      merchantOid: "ea1",
      email: "a@b.com",
      paymentAmountKurus: 49900,
      userBasket: "YmFzZQ==",
      noInstallment: "1",
      maxInstallment: "0",
      currency: "TL",
      testMode: "1",
      merchantSalt: salt,
      merchantKey: key,
    });
    const raw =
      "123" +
      "1.2.3.4" +
      "ea1" +
      "a@b.com" +
      "49900" +
      "YmFzZQ==" +
      "1" +
      "0" +
      "TL" +
      "1" +
      salt;
    expect(hash).toBe(createHmac("sha256", key).update(raw).digest("base64"));
  });

  it("verifies notification hash", () => {
    const merchantOid = "ea1";
    const status = "success";
    const totalAmount = "49900";
    const token = createHmac("sha256", key)
      .update(merchantOid + salt + status + totalAmount)
      .digest("base64");
    expect(
      verifyPaytrNotificationHash({
        merchantOid,
        status,
        totalAmount,
        hash: token,
        merchantSalt: salt,
        merchantKey: key,
      }),
    ).toBe(true);
    expect(
      verifyPaytrNotificationHash({
        merchantOid,
        status,
        totalAmount,
        hash: "bad",
        merchantSalt: salt,
        merchantKey: key,
      }),
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=@eduatlas/application -- paytr-crypto`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```ts
import { createHmac, timingSafeEqual } from "node:crypto";

export function buildPaytrUserBasket(planLabel: string, amountTry: number): string {
  const unit = Number(amountTry).toFixed(2);
  const json = JSON.stringify([[planLabel, unit, 1]]);
  return Buffer.from(json, "utf8").toString("base64");
}

export type PaytrGetTokenHashInput = {
  readonly merchantId: string;
  readonly userIp: string;
  readonly merchantOid: string;
  readonly email: string;
  readonly paymentAmountKurus: number;
  readonly userBasket: string;
  readonly noInstallment: string;
  readonly maxInstallment: string;
  readonly currency: string;
  readonly testMode: string;
  readonly merchantSalt: string;
  readonly merchantKey: string;
};

export function buildPaytrGetTokenHash(input: PaytrGetTokenHashInput): string {
  const hashSTR =
    `${input.merchantId}${input.userIp}${input.merchantOid}${input.email}` +
    `${input.paymentAmountKurus}${input.userBasket}${input.noInstallment}` +
    `${input.maxInstallment}${input.currency}${input.testMode}`;
  return createHmac("sha256", input.merchantKey)
    .update(hashSTR + input.merchantSalt)
    .digest("base64");
}

export type PaytrNotificationHashInput = {
  readonly merchantOid: string;
  readonly status: string;
  readonly totalAmount: string;
  readonly hash: string;
  readonly merchantSalt: string;
  readonly merchantKey: string;
};

export function verifyPaytrNotificationHash(input: PaytrNotificationHashInput): boolean {
  const expected = createHmac("sha256", input.merchantKey)
    .update(input.merchantOid + input.merchantSalt + input.status + input.totalAmount)
    .digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(input.hash);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
```

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit** (if requested)

```bash
git add packages/application/src/billing/paytr-crypto.ts packages/application/src/billing/paytr-crypto.test.ts
git commit -m "$(cat <<'EOF'
Add PayTR HMAC helpers for iframe token and callback.

EOF
)"
```

---

### Task 3: PaymentOrder repository (interface + Firestore + web wiring)

**Files:**
- Create: `packages/application/src/billing/payment-order-repository.ts`
- Create: `packages/firebase/src/billing/firestore-payment-order-repository.ts`
- Modify: `packages/firebase/src/billing/index.ts`
- Modify: `packages/firebase/src/server/index.ts`
- Modify: `packages/application/src/billing/index.ts`
- Modify: `packages/application/src/index.ts` (export type)
- Modify: `apps/web/src/server/billing/repository.ts`

**Interfaces:**
- Consumes: `PaymentOrder` from domain
- Produces: `PaymentOrderRepository` with `getByMerchantOid`, `save`

- [ ] **Step 1: Define repository interface**

```ts
import type { PaymentOrder } from "@eduatlas/domain";

export interface PaymentOrderRepository {
  getByMerchantOid(merchantOid: string): Promise<PaymentOrder | null>;
  save(order: PaymentOrder): Promise<PaymentOrder>;
}
```

- [ ] **Step 2: Implement Firestore adapter**

Collection: `payment_orders`, doc id = `merchantOid`. Mirror existing billing repos (counter hooks, freeze via `createPaymentOrder` on read).

Factory: `createFirestorePaymentOrderRepository(db)`.

- [ ] **Step 3: Wire in `apps/web/src/server/billing/repository.ts`**

Add `getPaymentOrderRepository()` with Firestore when backend available, else in-memory Map for local/dev. Export `resetBillingRepositoriesForTests` clearing the new promise too.

- [ ] **Step 4: Smoke-check TypeScript**

Run: `npm run typecheck --workspace=@eduatlas/firebase` (or repo-equivalent)
Expected: no errors on new exports

- [ ] **Step 5: Commit** (if requested)

```bash
git commit -m "$(cat <<'EOF'
Add Firestore payment_orders repository for PayTR.

EOF
)"
```

---

### Task 4: handlePaytrNotification use case

**Files:**
- Create: `packages/application/src/billing/handle-paytr-notification.ts`
- Test: `packages/application/src/billing/handle-paytr-notification.test.ts`
- Modify: `packages/application/src/billing/index.ts`, `packages/application/src/index.ts`

**Interfaces:**
- Consumes: `PaymentOrderRepository`, `InstitutionSubscriptionRepository`, `verifyPaytrNotificationHash`, `createInstitutionSubscription`, `computeSubscriptionPeriodEnd`
- Produces: `handlePaytrNotification(input) → { ok: true } | throws` / result type `{ responseBody: "OK" } | { error: "bad_hash" | ... }`

Prefer returning a result object so the route can map HTTP status:

```ts
export type PaytrNotificationResult =
  | { readonly kind: "ok" }
  | { readonly kind: "bad_hash" }
  | { readonly kind: "order_not_found" }
  | { readonly kind: "amount_mismatch" };
```

- [ ] **Step 1: Write failing tests** (in-memory repos)

Cases:
1. Bad hash → `bad_hash`, order unchanged, subscription untouched
2. Unknown merchantOid → `order_not_found`
3. success + matching amount → order `paid`, subscription `active` with `paymentProvider: "paytr"`, period end set
4. Duplicate success callback → still `ok`, no double-write side effects beyond idempotent same state
5. status != success → order `failed`, subscription unchanged
6. success but `total_amount` ≠ `order.amountKurus` → `amount_mismatch` (do not activate)

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement**

```ts
export type HandlePaytrNotificationInput = {
  readonly merchantOid: string;
  readonly status: string;
  readonly totalAmount: string; // kuruş as string from PayTR
  readonly hash: string;
  readonly merchantSalt: string;
  readonly merchantKey: string;
  readonly now?: Date;
};

export type HandlePaytrNotificationDeps = {
  readonly paymentOrders: PaymentOrderRepository;
  readonly subscriptions: InstitutionSubscriptionRepository;
};

export async function handlePaytrNotification(
  input: HandlePaytrNotificationInput,
  deps: HandlePaytrNotificationDeps,
): Promise<PaytrNotificationResult> {
  if (
    !verifyPaytrNotificationHash({
      merchantOid: input.merchantOid,
      status: input.status,
      totalAmount: input.totalAmount,
      hash: input.hash,
      merchantSalt: input.merchantSalt,
      merchantKey: input.merchantKey,
    })
  ) {
    return { kind: "bad_hash" };
  }

  const order = await deps.paymentOrders.getByMerchantOid(input.merchantOid);
  if (!order) return { kind: "order_not_found" };

  if (order.status === PaymentOrderStatus.Paid) {
    return { kind: "ok" }; // idempotent
  }

  const now = input.now ?? new Date();
  const nowIso = now.toISOString();
  const totalAmountKurus = Number.parseInt(input.totalAmount, 10);

  if (input.status === "success") {
    if (totalAmountKurus !== order.amountKurus) {
      return { kind: "amount_mismatch" };
    }
    await deps.paymentOrders.save(
      createPaymentOrder({
        ...order,
        status: PaymentOrderStatus.Paid,
        paytrStatus: input.status,
        totalAmountKurus,
        updatedAt: nowIso,
      }),
    );
    const periodEnd = computeSubscriptionPeriodEnd(now, order.billingPeriod);
    await deps.subscriptions.save(
      createInstitutionSubscription({
        id: order.institutionId,
        institutionId: order.institutionId,
        planCode: order.planCode,
        status: SubscriptionStatus.Active,
        billingPeriod: order.billingPeriod,
        currentPeriodStart: nowIso,
        currentPeriodEnd: periodEnd.toISOString(),
        paymentProvider: "paytr",
        externalSubscriptionId: order.merchantOid,
        updatedAt: nowIso,
      }),
    );
    return { kind: "ok" };
  }

  await deps.paymentOrders.save(
    createPaymentOrder({
      ...order,
      status: PaymentOrderStatus.Failed,
      paytrStatus: input.status,
      totalAmountKurus: Number.isFinite(totalAmountKurus) ? totalAmountKurus : undefined,
      updatedAt: nowIso,
    }),
  );
  return { kind: "ok" };
}
```

- [ ] **Step 4: Tests PASS**

- [ ] **Step 5: Commit** (if requested)

```bash
git commit -m "$(cat <<'EOF'
Activate subscriptions from verified PayTR notifications.

EOF
)"
```

---

### Task 5: startPaytrCheckout use case + PayTR token port

**Files:**
- Create: `packages/application/src/billing/paytr-token-gateway.ts` (interface only)
- Create: `packages/application/src/billing/start-paytr-checkout.ts`
- Test: `packages/application/src/billing/start-paytr-checkout.test.ts`
- Modify exports

**Interfaces:**
- Consumes: `BillingPlanRepository`, `PaymentOrderRepository`, `PaytrTokenGateway`
- Produces: `startPaytrCheckout` → `{ merchantOid, iframeToken }`

```ts
export type PaytrTokenRequest = {
  readonly merchantOid: string;
  readonly email: string;
  readonly paymentAmountKurus: number;
  readonly userBasket: string;
  readonly userName: string;
  readonly userAddress: string;
  readonly userPhone: string;
  readonly userIp: string;
  readonly merchantOkUrl: string;
  readonly merchantFailUrl: string;
};

export interface PaytrTokenGateway {
  getIframeToken(request: PaytrTokenRequest): Promise<string>;
}
```

- [ ] **Step 1: Failing tests**

1. Rejects `free` / unknown plan / inactive plan / amount 0
2. Creates pending order then calls gateway; returns token
3. If gateway throws, order remains pending (acceptable) or mark failed — **choose: leave pending**; surface error to caller
4. Uses monthly vs yearly price from plan

- [ ] **Step 2: Implement**

```ts
export type StartPaytrCheckoutInput = {
  readonly institutionId: string;
  readonly planCode: string;
  readonly billingPeriod: BillingPeriod;
  readonly email: string;
  readonly userName?: string;
  readonly userPhone?: string;
  readonly userAddress?: string;
  readonly userIp: string;
  readonly merchantOkUrl: string;
  readonly merchantFailUrl: string;
};

export type StartPaytrCheckoutDeps = {
  readonly plans: BillingPlanRepository;
  readonly paymentOrders: PaymentOrderRepository;
  readonly paytr: PaytrTokenGateway;
  readonly createOid?: () => string;
};

export async function startPaytrCheckout(
  input: StartPaytrCheckoutInput,
  deps: StartPaytrCheckoutDeps,
): Promise<{ merchantOid: string; iframeToken: string }> {
  const planCode = input.planCode.trim().toLowerCase();
  if (planCode === "free") throw new Error("Free plan is not purchasable.");
  const plan = await deps.plans.getByCode(planCode);
  if (!plan || !plan.active) throw new Error("Plan not found.");
  const amountTry =
    input.billingPeriod === BillingPeriod.Yearly
      ? plan.yearlyPriceTry
      : plan.monthlyPriceTry;
  if (amountTry <= 0) throw new Error("Plan price is not configured.");

  const merchantOid = (deps.createOid ?? createMerchantOid)();
  const order = createPaymentOrder({
    merchantOid,
    institutionId: input.institutionId,
    planCode,
    billingPeriod: input.billingPeriod,
    amountTry,
  });
  await deps.paymentOrders.save(order);

  const periodLabel = input.billingPeriod === BillingPeriod.Yearly ? "Yıllık" : "Aylık";
  const userBasket = buildPaytrUserBasket(`${plan.name} ${periodLabel}`, amountTry);

  const iframeToken = await deps.paytr.getIframeToken({
    merchantOid,
    email: input.email,
    paymentAmountKurus: order.amountKurus,
    userBasket,
    userName: input.userName?.trim() || "EduAtlas Kullanıcı",
    userAddress: input.userAddress?.trim() || "Türkiye",
    userPhone: input.userPhone?.trim() || "05000000000",
    userIp: input.userIp,
    merchantOkUrl: input.merchantOkUrl,
    merchantFailUrl: input.merchantFailUrl,
  });

  return { merchantOid, iframeToken };
}
```

- [ ] **Step 3: Tests PASS**

- [ ] **Step 4: Commit** (if requested)

```bash
git commit -m "$(cat <<'EOF'
Add startPaytrCheckout use case for iframe tokens.

EOF
)"
```

---

### Task 6: Web PayTR env + HTTP client + start checkout action

**Files:**
- Create: `apps/web/src/server/billing/paytr-env.ts`
- Create: `apps/web/src/server/billing/paytr-client.ts`
- Create: `apps/web/src/server/owner/start-paytr-checkout-action.ts`
- Modify: `apps/web/src/server/owner/get-owner-billing-view.ts`
- Optional: document env vars in existing `.env.example` if present

**Interfaces:**
- Consumes: `startPaytrCheckout`, `buildPaytrGetTokenHash`, `requireOwnerContext`
- Produces: `isPaytrConfigured()`, `createPaytrTokenGateway()`, `startPaytrCheckoutAction({ planCode, billingPeriod })`

- [ ] **Step 1: Env helper**

```ts
export type PaytrEnv = {
  readonly merchantId: string;
  readonly merchantKey: string;
  readonly merchantSalt: string;
  readonly testMode: "0" | "1";
  readonly debugOn: "0" | "1";
};

export function isPaytrConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return Boolean(
    env.PAYTR_MERCHANT_ID?.trim() &&
      env.PAYTR_MERCHANT_KEY?.trim() &&
      env.PAYTR_MERCHANT_SALT?.trim(),
  );
}

export function getPaytrEnv(env: NodeJS.ProcessEnv = process.env): PaytrEnv {
  if (!isPaytrConfigured(env)) {
    throw new Error("PayTR is not configured.");
  }
  const testMode = env.PAYTR_TEST_MODE === "0" ? "0" : "1";
  const debugOn =
    env.PAYTR_DEBUG_ON === "0" ? "0" : env.PAYTR_DEBUG_ON === "1" ? "1" : testMode;
  return {
    merchantId: env.PAYTR_MERCHANT_ID!.trim(),
    merchantKey: env.PAYTR_MERCHANT_KEY!.trim(),
    merchantSalt: env.PAYTR_MERCHANT_SALT!.trim(),
    testMode,
    debugOn,
  };
}
```

- [ ] **Step 2: HTTP client (`PaytrTokenGateway`)**

POST `https://www.paytr.com/odeme/api/get-token` with `application/x-www-form-urlencoded` body matching official sample fields (`merchant_id`, `merchant_key`, `merchant_salt`, email, payment_amount, merchant_oid, user_*, urls, basket, ip, timeout_limit=30, debug_on, test_mode, lang=tr, no_installment=1, max_installment=0, currency=TL, paytr_token).

Parse JSON; if `status !== "success"` throw with PayTR `reason` (do not log secrets).

- [ ] **Step 3: Server action**

```ts
"use server";

export type StartPaytrCheckoutActionResult =
  | { readonly ok: true; readonly merchantOid: string; readonly iframeToken: string }
  | { readonly ok: false; readonly message: string };

export async function startPaytrCheckoutAction(input: {
  planCode: string;
  billingPeriod: "monthly" | "yearly";
}): Promise<StartPaytrCheckoutActionResult> {
  // requireOwnerContext(); resolve email from user; client IP from headers()
  // x-forwarded-for first hop or "127.0.0.1"
  // origin from NEXT_PUBLIC_APP_URL or request headers
  // merchant_ok_url = `${origin}/owner/billing/result?status=ok`
  // merchant_fail_url = `${origin}/owner/billing/result?status=fail`
  // light in-memory rate limit: max 5 starts / institution / 10 minutes
}
```

- [ ] **Step 4: Billing view**

When `isPaytrConfigured()`, set `paymentComingSoonMessage: ""` and `checkoutEnabled: true` (extend `OwnerBillingPageData`). When not configured, keep existing Turkish coming-soon copy and `checkoutEnabled: false`.

- [ ] **Step 5: Manual typecheck of action + client**

- [ ] **Step 6: Commit** (if requested)

```bash
git commit -m "$(cat <<'EOF'
Wire PayTR get-token client and owner checkout action.

EOF
)"
```

---

### Task 7: Callback route + result page

**Files:**
- Create: `apps/web/src/app/api/billing/paytr/callback/route.ts`
- Create: `apps/web/src/app/owner/billing/result/page.tsx`

**Interfaces:**
- Consumes: `handlePaytrNotification`, `getPaytrEnv`, repos
- Produces: plain-text `OK` on success path; non-OK body/status on bad hash

- [ ] **Step 1: Implement callback**

```ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData();
  const merchantOid = String(form.get("merchant_oid") ?? "");
  const status = String(form.get("status") ?? "");
  const totalAmount = String(form.get("total_amount") ?? "");
  const hash = String(form.get("hash") ?? "");

  // getPaytrEnv(); handlePaytrNotification(...)
  // kind === "ok" → new NextResponse("OK", { status: 200, headers: { "Content-Type": "text/plain" } })
  // bad_hash / amount_mismatch → 400 with non-OK body (PayTR retries / ops notice)
  // order_not_found → 404 non-OK
}
```

Do **not** require session. Never activate from GET.

- [ ] **Step 2: Result page**

Owner-gated informational page:
- `status=ok` → “Ödemeniz alındı. Paketiniz kısa süre içinde aktifleşir.” + link back to `/owner/billing`
- `status=fail` → “Ödeme tamamlanamadı.” + link back
- Optionally soft-refresh by re-reading billing view (no activation logic)

- [ ] **Step 3: Commit** (if requested)

```bash
git commit -m "$(cat <<'EOF'
Add PayTR notification callback and billing result pages.

EOF
)"
```

---

### Task 8: Owner billing UI — enable CTA + PayTR iframe modal

**Files:**
- Modify: `packages/ui/src/owner/owner-billing-page.tsx`
- Modify: `packages/ui/src/styles/owner-portal.css`
- Modify: `packages/ui/src/index.ts` if types exported change
- Modify: `apps/web/src/app/owner/billing/page.tsx` (pass action if needed)

**Interfaces:**
- Consumes: `startPaytrCheckoutAction`, `OwnerBillingPageData.checkoutEnabled`
- Produces: modal with iframe `https://www.paytr.com/odeme/guvenli/{iframeToken}`

- [ ] **Step 1: Extend page data types**

```ts
export type OwnerBillingPageData = Readonly<{
  // ...existing
  paymentComingSoonMessage: string;
  checkoutEnabled: boolean;
}>;

export type OwnerBillingPageProps = {
  data: OwnerBillingPageData;
  onStartCheckout?: (input: {
    planCode: string;
    billingPeriod: "monthly" | "yearly";
  }) => Promise<
    | { ok: true; iframeToken: string; merchantOid: string }
    | { ok: false; message: string }
  >;
  className?: string;
};
```

Wire `onStartCheckout={startPaytrCheckoutAction}` from the route (client wrapper or pass bound server action).

- [ ] **Step 2: CTA behavior**

| Case | Button |
|------|--------|
| `plan.code === "free"` | “Ücretsiz” disabled (or hide purchase) |
| `plan.isCurrent` | “Mevcut paket” disabled |
| `!checkoutEnabled` | “Ödeme yakında” disabled + coming-soon message |
| else | “Satın al” enabled → call onStartCheckout → open dialog |

- [ ] **Step 3: Modal**

Use native `<dialog>` (same pattern as `.ea-profile-dialog` / admin claim dialog):
- Title: plan name + period + price
- iframe: `src={`https://www.paytr.com/odeme/guvenli/${token}`}` width 100%, min-height 420px, `frameBorder={0}`
- Close button; closing does not cancel PayTR order
- On error from action: show inline error text

CSS under `.ea-owner-billing__pay-dialog` — keep consistent with owner portal, no purple glow cards.

- [ ] **Step 4: Hide or empty coming-soon banner when `checkoutEnabled`**

- [ ] **Step 5: Manual UI check** (with `PAYTR_TEST_MODE=1` credentials)

- [ ] **Step 6: Commit** (if requested)

```bash
git commit -m "$(cat <<'EOF'
Enable owner billing PayTR iframe checkout modal.

EOF
)"
```

---

### Task 9: Acceptance pass + ops checklist

**Files:** none required (verification)

- [ ] **Step 1: Unit suite**

Run:
```bash
npm test --workspace=@eduatlas/domain -- payment-order
npm test --workspace=@eduatlas/application -- paytr-crypto
npm test --workspace=@eduatlas/application -- handle-paytr-notification
npm test --workspace=@eduatlas/application -- start-paytr-checkout
```
Expected: all PASS

- [ ] **Step 2: Env on Vercel / local**

Set `PAYTR_MERCHANT_ID`, `PAYTR_MERCHANT_KEY`, `PAYTR_MERCHANT_SALT`, `PAYTR_TEST_MODE=1`. Confirm `NEXT_PUBLIC_APP_URL` matches reachable HTTPS origin for ok/fail URLs.

- [ ] **Step 3: PayTR merchant panel**

Bildirim URL: `https://<host>/api/billing/paytr/callback`

- [ ] **Step 4: Demo payment**

Owner → Billing → Pro monthly → modal iframe → test card → callback `OK` → subscription `active` in Firestore → billing page shows Pro.

- [ ] **Step 5: Negative checks**

- Fail payment → order `failed`, plan unchanged
- Hit ok URL without callback → plan still old until notification
- Missing env → CTA still “Ödeme yakında”

---

## Spec coverage (self-review)

| Spec section | Task |
|--------------|------|
| One-time iframe + modal | 5, 6, 8 |
| PaymentOrder model + collection | 1, 3 |
| get-token HMAC + params | 2, 5, 6 |
| Callback hash + OK + idempotent activate | 2, 4, 7 |
| ok/fail informational only | 7 |
| Env + disabled without credentials | 6, 8 |
| No installments / Free not purchasable | Global + 5, 8 |
| Amount mismatch closed | 4 |
| Rate limit start checkout | 6 |

No placeholders left; types aligned across tasks (`merchantOid`, `amountKurus`, `paymentProvider: "paytr"`).
