"use server";

import { startPaytrCheckout } from "@eduatlas/application";
import { BillingPeriod } from "@eduatlas/domain";
import { headers } from "next/headers";
import { createPaytrTokenGateway } from "../billing/paytr-client";
import { isPaytrConfigured } from "../billing/paytr-env";
import {
  getBillingPlanRepository,
  getPaymentOrderRepository,
} from "../billing/repository";
import { getSeoSiteConfig } from "@/lib/seo-site";
import { requireOwnerContext } from "./require-owner-context";

export type StartPaytrCheckoutActionResult =
  | { readonly ok: true; readonly merchantOid: string; readonly iframeToken: string }
  | { readonly ok: false; readonly message: string };

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;
const checkoutAttempts = new Map<string, number[]>();

function allowCheckoutAttempt(institutionId: string): boolean {
  const now = Date.now();
  const recent = (checkoutAttempts.get(institutionId) ?? []).filter(
    (t) => now - t < RATE_WINDOW_MS,
  );
  if (recent.length >= RATE_MAX) {
    checkoutAttempts.set(institutionId, recent);
    return false;
  }
  recent.push(now);
  checkoutAttempts.set(institutionId, recent);
  return true;
}

function clientIpFromHeaders(headerList: Headers): string {
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headerList.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "127.0.0.1";
}

export async function startPaytrCheckoutAction(input: {
  planCode: string;
  billingPeriod: "monthly" | "yearly";
}): Promise<StartPaytrCheckoutActionResult> {
  try {
    if (!isPaytrConfigured()) {
      return { ok: false, message: "Ödeme altyapısı henüz yapılandırılmadı." };
    }

    const { user, institutionId } = await requireOwnerContext();
    if (!allowCheckoutAttempt(institutionId)) {
      return {
        ok: false,
        message: "Çok fazla deneme yaptınız. Lütfen birkaç dakika sonra tekrar deneyin.",
      };
    }

    const billingPeriod =
      input.billingPeriod === "yearly" ? BillingPeriod.Yearly : BillingPeriod.Monthly;
    const site = getSeoSiteConfig();
    const origin = site.siteUrl.replace(/\/+$/, "");
    const headerList = await headers();

    const [plans, paymentOrders] = await Promise.all([
      getBillingPlanRepository(),
      getPaymentOrderRepository(),
    ]);

    const result = await startPaytrCheckout(
      {
        institutionId,
        planCode: input.planCode,
        billingPeriod,
        email: user.email,
        userName: user.displayName,
        userIp: clientIpFromHeaders(headerList),
        merchantOkUrl: `${origin}/owner/billing/result?status=ok`,
        merchantFailUrl: `${origin}/owner/billing/result?status=fail`,
      },
      {
        plans,
        paymentOrders,
        paytr: createPaytrTokenGateway(),
      },
    );

    return {
      ok: true,
      merchantOid: result.merchantOid,
      iframeToken: result.iframeToken,
    };
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim()
        ? error.message
        : "Ödeme başlatılamadı. Lütfen tekrar deneyin.";
    return { ok: false, message };
  }
}
