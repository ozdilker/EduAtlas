import {
  BillingPeriod,
  createMerchantOid,
  createPaymentOrder,
  type BillingPeriod as BillingPeriodType,
} from "@eduatlas/domain";
import type { BillingPlanRepository } from "./billing-plan-repository";
import type { PaymentOrderRepository } from "./payment-order-repository";
import { buildPaytrUserBasket } from "./paytr-crypto";
import type { PaytrTokenGateway } from "./paytr-token-gateway";

export type StartPaytrCheckoutInput = {
  readonly institutionId: string;
  readonly planCode: string;
  readonly billingPeriod: BillingPeriodType;
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
    input.billingPeriod === BillingPeriod.Yearly ? plan.yearlyPriceTry : plan.monthlyPriceTry;
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
