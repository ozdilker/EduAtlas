"use server";

import { createBillingPlan } from "@eduatlas/domain";
import { revalidatePath } from "next/cache";
import {
  ensureDefaultBillingPlansSeeded,
  getBillingPlanRepository,
} from "@/server/billing/repository";

/**
 * Admin billing plan price/trial update — form action (void return for <form action>).
 */
export async function updateAdminBillingPlanAction(formData: FormData): Promise<void> {
  await ensureDefaultBillingPlansSeeded();
  const repo = await getBillingPlanRepository();
  const planId = String(formData.get("planId") ?? "").trim();
  const all = await repo.listAll();
  const current = all.find((plan) => plan.id === planId);
  if (!current) {
    throw new Error("Paket bulunamadı.");
  }

  const monthlyPriceTry = Number(formData.get("monthlyPriceTry"));
  const yearlyPriceTry = Number(formData.get("yearlyPriceTry"));
  const trialDays = Number(formData.get("trialDays"));
  const active = formData.get("active") === "1";

  await repo.save(
    createBillingPlan({
      ...current,
      monthlyPriceTry: Number.isFinite(monthlyPriceTry) ? monthlyPriceTry : current.monthlyPriceTry,
      yearlyPriceTry: Number.isFinite(yearlyPriceTry) ? yearlyPriceTry : current.yearlyPriceTry,
      trialDays: Number.isFinite(trialDays) ? trialDays : current.trialDays,
      active,
      updatedAt: new Date().toISOString(),
    }),
  );

  revalidatePath("/admin/billing");
  revalidatePath("/owner/billing");
}
