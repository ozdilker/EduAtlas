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
