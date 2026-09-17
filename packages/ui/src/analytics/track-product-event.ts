export type ProductAnalyticsParams = Readonly<
  Record<string, string | number | boolean | undefined>
>;

/**
 * Soft bridge to the host app analytics helper (apps/web).
 * Fail-open: missing bridge or throw never breaks UI.
 */
export function trackProductEvent(
  event: string,
  params?: ProductAnalyticsParams,
): void {
  if (typeof globalThis === "undefined") return;
  try {
    const track = (
      globalThis as typeof globalThis & {
        __EDUATLAS_TRACK__?: (
          name: string,
          payload?: ProductAnalyticsParams,
        ) => void;
      }
    ).__EDUATLAS_TRACK__;
    track?.(event, params);
  } catch {
    // fail-open
  }
}

export const PRODUCT_ANALYTICS_EVENTS = Object.freeze({
  InstitutionView: "institution_view",
  Search: "search",
  CitySelected: "city_selected",
  DistrictSelected: "district_selected",
  WebsiteClick: "website_click",
  PhoneClick: "phone_click",
  MapClick: "map_click",
  WhatsappClick: "whatsapp_click",
  SocialClick: "social_click",
  LeadFormOpen: "lead_form_open",
  LeadSubmitted: "lead_submitted",
  ClaimProfileStarted: "claim_profile_started",
  ClaimProfileCompleted: "claim_profile_completed",
} as const);
