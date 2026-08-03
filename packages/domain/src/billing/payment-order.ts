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
