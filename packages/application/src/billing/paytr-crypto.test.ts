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
