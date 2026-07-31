import { AdminBillingPage } from "@eduatlas/ui";
import { updateAdminBillingPlanAction } from "@/server/admin/billing-plan-action";
import {
  ensureDefaultBillingPlansSeeded,
  getBillingPlanRepository,
} from "@/server/billing/repository";

export const dynamic = "force-dynamic";

export default async function AdminBillingRoute() {
  await ensureDefaultBillingPlansSeeded().catch(() => undefined);
  const plans = await (await getBillingPlanRepository()).listAll();

  return (
    <AdminBillingPage
      plans={plans.map((plan) => ({
        id: plan.id,
        code: plan.code,
        name: plan.name,
        monthlyPriceTry: plan.monthlyPriceTry,
        yearlyPriceTry: plan.yearlyPriceTry,
        trialDays: plan.trialDays,
        active: plan.active,
        sortOrder: plan.sortOrder,
      }))}
      updateAction={updateAdminBillingPlanAction}
    />
  );
}
