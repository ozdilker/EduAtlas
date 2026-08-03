import {
  computeSubscriptionPeriodEnd,
  createInstitutionSubscription,
  createPaymentOrder,
  PaymentOrderStatus,
  SubscriptionStatus,
  type PaymentOrder,
} from "@eduatlas/domain";
import type { InstitutionSubscriptionRepository } from "./subscription-repository";
import type { PaymentOrderRepository } from "./payment-order-repository";
import { verifyPaytrNotificationHash } from "./paytr-crypto";

export type PaytrNotificationResult =
  | { readonly kind: "ok" }
  | { readonly kind: "bad_hash" }
  | { readonly kind: "order_not_found" }
  | { readonly kind: "amount_mismatch" };

export type HandlePaytrNotificationInput = {
  readonly merchantOid: string;
  readonly status: string;
  readonly totalAmount: string;
  readonly hash: string;
  readonly merchantSalt: string;
  readonly merchantKey: string;
  readonly now?: Date;
};

export type HandlePaytrNotificationDeps = {
  readonly paymentOrders: PaymentOrderRepository;
  readonly subscriptions: InstitutionSubscriptionRepository;
};

function withOrderUpdates(
  order: PaymentOrder,
  updates: {
    status: (typeof PaymentOrderStatus)[keyof typeof PaymentOrderStatus];
    paytrStatus: string;
    totalAmountKurus?: number;
    updatedAt: string;
  },
): PaymentOrder {
  return createPaymentOrder({
    merchantOid: order.merchantOid,
    institutionId: order.institutionId,
    planCode: order.planCode,
    billingPeriod: order.billingPeriod,
    amountTry: order.amountTry,
    status: updates.status,
    paytrStatus: updates.paytrStatus,
    ...(typeof updates.totalAmountKurus === "number"
      ? { totalAmountKurus: updates.totalAmountKurus }
      : {}),
    createdAt: order.createdAt,
    updatedAt: updates.updatedAt,
  });
}

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
    return { kind: "ok" };
  }

  const now = input.now ?? new Date();
  const nowIso = now.toISOString();
  const totalAmountKurus = Number.parseInt(input.totalAmount, 10);

  if (input.status === "success") {
    if (totalAmountKurus !== order.amountKurus) {
      return { kind: "amount_mismatch" };
    }
    await deps.paymentOrders.save(
      withOrderUpdates(order, {
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
    withOrderUpdates(order, {
      status: PaymentOrderStatus.Failed,
      paytrStatus: input.status,
      ...(Number.isFinite(totalAmountKurus) ? { totalAmountKurus } : {}),
      updatedAt: nowIso,
    }),
  );
  return { kind: "ok" };
}
