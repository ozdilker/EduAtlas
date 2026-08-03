import {
  BillingEntitlement,
  createBillingPlan,
  DefaultBillingPlanCode,
  type BillingPlan,
} from "@eduatlas/domain";

/**
 * Seed catalog for PRD-BILLING-001 — prices/entitlements editable later via Admin.
 */
export function buildDefaultBillingPlans(now = new Date().toISOString()): readonly BillingPlan[] {
  return Object.freeze([
    createBillingPlan({
      id: "plan_free",
      code: DefaultBillingPlanCode.Free,
      name: "Free",
      description: "Kurum profili yönetimi ve ömür boyu ilk 3 lead.",
      monthlyPriceTry: 0,
      yearlyPriceTry: 0,
      trialDays: 0,
      sortOrder: 0,
      updatedAt: now,
      entitlements: {
        [BillingEntitlement.FreeLeadQuota]: 3,
        [BillingEntitlement.ProfileCompletenessAnalysis]: true,
      },
    }),
    createBillingPlan({
      id: "plan_pro",
      code: DefaultBillingPlanCode.Pro,
      name: "Pro",
      description: "Sınırsız lead, export, bildirimler ve temel istatistikler.",
      monthlyPriceTry: 499,
      yearlyPriceTry: 4990,
      discountPercent: 17,
      trialDays: 7,
      sortOrder: 10,
      updatedAt: now,
      entitlements: {
        [BillingEntitlement.UnlimitedLeads]: true,
        [BillingEntitlement.LeadFiltering]: true,
        [BillingEntitlement.LeadExport]: true,
        [BillingEntitlement.EmailNotifications]: true,
        [BillingEntitlement.AnalyticsBasic]: true,
        [BillingEntitlement.ProfileCompletenessAnalysis]: true,
      },
    }),
    createBillingPlan({
      id: "plan_premium",
      code: DefaultBillingPlanCode.Premium,
      name: "Premium",
      description: "Pro + vitrin, sponsorlu görünüm ve detaylı analitik.",
      monthlyPriceTry: 999,
      yearlyPriceTry: 9990,
      discountPercent: 17,
      trialDays: 7,
      sortOrder: 20,
      updatedAt: now,
      entitlements: {
        [BillingEntitlement.UnlimitedLeads]: true,
        [BillingEntitlement.LeadFiltering]: true,
        [BillingEntitlement.LeadExport]: true,
        [BillingEntitlement.EmailNotifications]: true,
        [BillingEntitlement.AnalyticsBasic]: true,
        [BillingEntitlement.AnalyticsAdvanced]: true,
        [BillingEntitlement.ProfileCompletenessAnalysis]: true,
        [BillingEntitlement.CityShowcase]: true,
        [BillingEntitlement.CategoryShowcase]: true,
        [BillingEntitlement.SponsoredListing]: true,
        [BillingEntitlement.FeaturedBadge]: true,
        [BillingEntitlement.ClickReports]: true,
        [BillingEntitlement.SearchReports]: true,
        [BillingEntitlement.LeadConversionRates]: true,
      },
    }),
  ]);
}
