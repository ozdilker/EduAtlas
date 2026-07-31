import {
  resolveInstitutionBillingAccess,
} from "@eduatlas/application";
import type { OwnerBillingPageData } from "@eduatlas/ui";
import {
  ensureDefaultBillingPlansSeeded,
  getBillingPlanRepository,
  getInstitutionSubscriptionRepository,
} from "../billing/repository";
import { getInstitutionRepository } from "../institutions/repository";
import { getOwnerDemoInstitutionId } from "./owner-demo-context";
import { createInstitutionId, institutionIdAsString } from "@eduatlas/domain";

const PAYMENT_COMING_SOON =
  "Ödeme altyapısı yakında. Şimdilik paketleri inceleyebilirsiniz; tahsilat henüz aktif değil.";

export async function getOwnerBillingView(
  institutionId = getOwnerDemoInstitutionId(),
): Promise<OwnerBillingPageData | null> {
  await ensureDefaultBillingPlansSeeded().catch(() => undefined);

  const [institutionRepository, billingPlanRepository, subscriptionRepository] = await Promise.all([
    getInstitutionRepository(),
    getBillingPlanRepository(),
    getInstitutionSubscriptionRepository(),
  ]);

  const institution = await institutionRepository.getById(createInstitutionId(institutionId));
  if (!institution) return null;

  const access = await resolveInstitutionBillingAccess(institutionIdAsString(institution.id), {
    billingPlanRepository,
    subscriptionRepository,
  });
  const plans = await billingPlanRepository.listActive();

  return {
    institutionName: institution.name,
    ...(institution.logoUrl ? { institutionLogoUrl: institution.logoUrl } : {}),
    currentPlanCode: access.planCode,
    currentPlanName: access.planName,
    paymentComingSoonMessage: PAYMENT_COMING_SOON,
    plans: plans.map((plan) => ({
      code: plan.code,
      name: plan.name,
      ...(plan.description ? { description: plan.description } : {}),
      monthlyPriceTry: plan.monthlyPriceTry,
      yearlyPriceTry: plan.yearlyPriceTry,
      trialDays: plan.trialDays,
      isCurrent: plan.code === access.planCode,
      highlight: plan.code === "premium",
    })),
  };
}
