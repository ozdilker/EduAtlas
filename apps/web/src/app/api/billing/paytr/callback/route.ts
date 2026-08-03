import { handlePaytrNotification } from "@eduatlas/application";
import { NextResponse } from "next/server";
import { getPaytrEnv, isPaytrConfigured } from "@/server/billing/paytr-env";
import {
  getInstitutionSubscriptionRepository,
  getPaymentOrderRepository,
} from "@/server/billing/repository";

export const dynamic = "force-dynamic";

function plain(body: string, status: number) {
  return new NextResponse(body, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function POST(request: Request) {
  if (!isPaytrConfigured()) {
    return plain("PayTR not configured", 503);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return plain("invalid body", 400);
  }

  const merchantOid = String(form.get("merchant_oid") ?? "").trim();
  const status = String(form.get("status") ?? "").trim();
  const totalAmount = String(form.get("total_amount") ?? "").trim();
  const hash = String(form.get("hash") ?? "").trim();

  if (!merchantOid || !status || !totalAmount || !hash) {
    return plain("missing fields", 400);
  }

  const env = getPaytrEnv();
  const [paymentOrders, subscriptions] = await Promise.all([
    getPaymentOrderRepository(),
    getInstitutionSubscriptionRepository(),
  ]);

  const result = await handlePaytrNotification(
    {
      merchantOid,
      status,
      totalAmount,
      hash,
      merchantSalt: env.merchantSalt,
      merchantKey: env.merchantKey,
    },
    { paymentOrders, subscriptions },
  );

  if (result.kind === "ok") {
    return plain("OK", 200);
  }
  if (result.kind === "bad_hash") {
    return plain("bad hash", 400);
  }
  if (result.kind === "order_not_found") {
    return plain("order not found", 404);
  }
  return plain("amount mismatch", 400);
}
