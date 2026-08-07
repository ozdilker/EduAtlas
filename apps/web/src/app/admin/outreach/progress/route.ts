import {
  estimateDeliveryEtaMinutes,
  loadOutreachDeliveryConfig,
  remainingDeliveryJobs,
} from "@eduatlas/application";
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth/current-session";
import { getOutreachService, tickOutreachDelivery } from "@/server/outreach/store";

export const dynamic = "force-dynamic";

/**
 * Growth Center live progress JSON (+ worker tick when status=running).
 */
export async function GET(request: Request): Promise<Response> {
  await requireAdminSession();
  const url = new URL(request.url);
  const campaignId = url.searchParams.get("campaignId")?.trim() ?? "";
  if (!campaignId) {
    return NextResponse.json({ error: "campaignId required" }, { status: 400 });
  }

  const statusParam = url.searchParams.get("status")?.trim() ?? "";
  let processed = 0;
  if (statusParam === "running") {
    const tick = await tickOutreachDelivery();
    processed = tick.processed;
  }

  const service = await getOutreachService();
  const progress = await service.getProgress(campaignId);
  const config = loadOutreachDeliveryConfig();
  const warmup = await service.getWarmupSettings();
  const remaining = remainingDeliveryJobs(progress);
  const etaMinutes = estimateDeliveryEtaMinutes(remaining, config.ratePerMinute);

  return NextResponse.json({
    progress,
    remaining,
    etaMinutes,
    warmupStage: warmup.stage,
    warmupLimit: warmup.limits[warmup.stage],
    ratePerMinute: config.ratePerMinute,
    processed,
  });
}
