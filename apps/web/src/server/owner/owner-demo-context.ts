import { isFirebaseAuthConfigured } from "../auth/authentication-service";

/**
 * Dev owner portal seed institution — isolated from real owner bindings.
 * Never auto-applied as a claim→owner bind; only used when demo fallback is enabled.
 */
export const OWNER_DEMO_INSTITUTION_ID = "seed_inst_ist_kolej_1";

/**
 * Optional override via env for local demos.
 */
export function getOwnerDemoInstitutionId(): string {
  const fromEnv = process.env.OWNER_DEMO_INSTITUTION_ID?.trim();
  return fromEnv || OWNER_DEMO_INSTITUTION_ID;
}

/**
 * When true, authenticated owners without an approved binding may use the demo
 * seed institution.
 *
 * Default: only when Firebase Auth is unavailable (memory auth fallback path).
 * Disabled whenever Firebase Auth is configured, and always in production.
 * Override with EDUATLAS_OWNER_DEMO_FALLBACK=true|false.
 */
export function isOwnerDemoInstitutionFallbackEnabled(): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  const flag = process.env.EDUATLAS_OWNER_DEMO_FALLBACK?.trim().toLowerCase();
  if (flag === "1" || flag === "true") {
    return true;
  }
  if (flag === "0" || flag === "false") {
    return false;
  }
  return !isFirebaseAuthConfigured();
}
