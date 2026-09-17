export const ANALYTICS_EVENTS = Object.freeze({
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

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export type AnalyticsParamValue = string | number | boolean;

export type AnalyticsParams = Readonly<Record<string, AnalyticsParamValue>>;

/** Keys that must never reach GA4 (case-insensitive match on param name). */
const PII_PARAM_DENYLIST = Object.freeze(
  new Set([
    "email",
    "phone",
    "telephone",
    "mobile",
    "name",
    "full_name",
    "fullname",
    "displayname",
    "display_name",
    "parent_name",
    "message",
    "lead_message",
    "uid",
    "user_id",
    "userid",
    "firebase_uid",
    "token",
    "id_token",
    "access_token",
    "password",
    "address",
    "contact_email",
    "contact_phone",
  ]),
);

export type GtagFunction = (
  command: "config" | "event" | "js" | "set",
  targetOrDate: string | Date,
  params?: Record<string, unknown>,
) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GtagFunction;
    __EDUATLAS_TRACK__?: (
      event: string,
      params?: Record<string, AnalyticsParamValue | undefined>,
    ) => void;
  }
}

/**
 * Firebase web measurement ID (G-…) doubles as GA4 measurement ID when Analytics is linked.
 * Reuse existing env — do not invent a parallel convention unless this is unset.
 */
export function getGaMeasurementId(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): string | null {
  const raw = env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim() || "";
  if (!raw) return null;
  if (!/^G-[A-Z0-9]+$/i.test(raw)) return null;
  return raw;
}

export function isAnalyticsEnabled(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): boolean {
  if (env.NODE_ENV !== "production") return false;
  return Boolean(getGaMeasurementId(env));
}

export function sanitizeAnalyticsParams(
  params?: Record<string, AnalyticsParamValue | undefined | null>,
): Record<string, AnalyticsParamValue> {
  if (!params) return {};
  const out: Record<string, AnalyticsParamValue> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const normalized = key.trim().toLowerCase().replace(/[\s-]+/g, "_");
    if (PII_PARAM_DENYLIST.has(normalized)) continue;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) continue;
      // Drop values that look like emails / phones even under safe keys.
      if (trimmed.includes("@") || /^\+?\d[\d\s()-]{6,}$/.test(trimmed)) continue;
      out[key] = trimmed.slice(0, 100);
      continue;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      out[key] = value;
    }
  }
  return out;
}

/**
 * Fail-open product analytics. Browser-only. No Firestore / API.
 */
export function trackEvent(
  event: string,
  params?: Record<string, AnalyticsParamValue | undefined | null>,
): void {
  try {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV !== "production") return;
    if (!getGaMeasurementId()) return;
    const name = event.trim();
    if (!name) return;
    const safe = sanitizeAnalyticsParams(params);
    const gtag = window.gtag;
    if (typeof gtag !== "function") return;
    gtag("event", name, safe);
  } catch {
    // fail-open
  }
}

/** Installs a bridge so packages/ui can emit events without importing apps/web. */
export function installAnalyticsBridge(): void {
  if (typeof window === "undefined") return;
  window.__EDUATLAS_TRACK__ = (event, params) => {
    trackEvent(event, params);
  };
}
