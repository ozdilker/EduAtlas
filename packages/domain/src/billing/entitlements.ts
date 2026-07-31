/**
 * Stable entitlement keys — plans assign values; app code never hardcodes plan names for access.
 */
export const BillingEntitlement = {
  FreeLeadQuota: "freeLeadQuota",
  UnlimitedLeads: "unlimitedLeads",
  LeadExport: "leadExport",
  LeadFiltering: "leadFiltering",
  EmailNotifications: "emailNotifications",
  AnalyticsBasic: "analyticsBasic",
  AnalyticsAdvanced: "analyticsAdvanced",
  ProfileCompletenessAnalysis: "profileCompletenessAnalysis",
  CityShowcase: "cityShowcase",
  CategoryShowcase: "categoryShowcase",
  SponsoredListing: "sponsoredListing",
  FeaturedBadge: "featuredBadge",
  ClickReports: "clickReports",
  SearchReports: "searchReports",
  LeadConversionRates: "leadConversionRates",
} as const;

export type BillingEntitlementKey = (typeof BillingEntitlement)[keyof typeof BillingEntitlement];

/** boolean flags or numeric quotas */
export type EntitlementValue = boolean | number;

export type EntitlementMap = Readonly<Partial<Record<string, EntitlementValue>>>;

export function entitlementFlag(map: EntitlementMap | null | undefined, key: string): boolean {
  const value = map?.[key];
  return value === true;
}

export function entitlementNumber(
  map: EntitlementMap | null | undefined,
  key: string,
  fallback = 0,
): number {
  const value = map?.[key];
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return value;
  }
  return fallback;
}

export type LeadVisibility = "full" | "masked";

/**
 * Lifetime ordinal is 1-based (oldest lead = 1).
 */
export function resolveLeadVisibility(input: {
  readonly ordinal: number;
  readonly entitlements: EntitlementMap;
}): LeadVisibility {
  if (input.ordinal < 1) {
    return "masked";
  }
  if (entitlementFlag(input.entitlements, BillingEntitlement.UnlimitedLeads)) {
    return "full";
  }
  const quota = entitlementNumber(input.entitlements, BillingEntitlement.FreeLeadQuota, 0);
  return input.ordinal <= quota ? "full" : "masked";
}
