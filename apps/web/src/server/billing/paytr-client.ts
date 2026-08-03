import {
  buildPaytrGetTokenHash,
  type PaytrTokenGateway,
  type PaytrTokenRequest,
} from "@eduatlas/application";
import { getPaytrEnv, type PaytrEnv } from "./paytr-env";

const PAYTR_GET_TOKEN_URL = "https://www.paytr.com/odeme/api/get-token";

type PaytrTokenResponse = {
  status?: string;
  token?: string;
  reason?: string;
};

export function createPaytrTokenGateway(env: PaytrEnv = getPaytrEnv()): PaytrTokenGateway {
  return {
    async getIframeToken(request: PaytrTokenRequest): Promise<string> {
      const paytrToken = buildPaytrGetTokenHash({
        merchantId: env.merchantId,
        userIp: request.userIp,
        merchantOid: request.merchantOid,
        email: request.email,
        paymentAmountKurus: request.paymentAmountKurus,
        userBasket: request.userBasket,
        noInstallment: "1",
        maxInstallment: "0",
        currency: "TL",
        testMode: env.testMode,
        merchantSalt: env.merchantSalt,
        merchantKey: env.merchantKey,
      });

      const body = new URLSearchParams({
        merchant_id: env.merchantId,
        merchant_key: env.merchantKey,
        merchant_salt: env.merchantSalt,
        email: request.email,
        payment_amount: String(request.paymentAmountKurus),
        merchant_oid: request.merchantOid,
        user_name: request.userName,
        user_address: request.userAddress,
        user_phone: request.userPhone,
        merchant_ok_url: request.merchantOkUrl,
        merchant_fail_url: request.merchantFailUrl,
        user_basket: request.userBasket,
        user_ip: request.userIp,
        timeout_limit: "30",
        debug_on: env.debugOn,
        test_mode: env.testMode,
        lang: "tr",
        no_installment: "1",
        max_installment: "0",
        currency: "TL",
        paytr_token: paytrToken,
      });

      const response = await fetch(PAYTR_GET_TOKEN_URL, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
      });

      const text = await response.text();
      let data: PaytrTokenResponse;
      try {
        data = JSON.parse(text) as PaytrTokenResponse;
      } catch {
        throw new Error("PayTR token response was not JSON.");
      }

      if (data.status !== "success" || !data.token?.trim()) {
        throw new Error(data.reason?.trim() || "PayTR token request failed.");
      }

      return data.token.trim();
    },
  };
}
