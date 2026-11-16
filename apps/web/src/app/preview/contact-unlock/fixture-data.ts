/**
 * Synthetic Preview fixture. These values are not real institutions or parents.
 * The route stays unlinked and is refused outside Vercel Preview.
 */
export const PREVIEW_UNLOCK_INSTITUTION = {
  id: "inst_preview_contact_unlock",
  slug: "ornek-akademi-preview",
  name: "Örnek Akademi",
  phone: "+905550100001",
  whatsapp: "+905550100002",
  email: "onizleme@example.com",
} as const;

export const PREVIEW_LOCKED_INSTITUTION = {
  id: "inst_preview_contact_locked",
  slug: "ornek-kilitli-akademi-preview",
  name: "Örnek Kilitli Akademi",
  phone: "+905550100011",
  whatsapp: "+905550100012",
  email: "kilitli@example.com",
} as const;

export type PreviewFixtureInstitution =
  | typeof PREVIEW_UNLOCK_INSTITUTION
  | typeof PREVIEW_LOCKED_INSTITUTION;

export function isPreviewContactUnlockFixtureEnabled(
  env: { VERCEL_ENV?: string } = { VERCEL_ENV: process.env.VERCEL_ENV },
): boolean {
  return env.VERCEL_ENV === "preview";
}

/**
 * Only the successful fake flow may grant, and only for the first fixture institution.
 * A failure never grants. The locked institution id never grants.
 */
export function shouldGrantPreviewContactUnlock(
  outcome: "success" | "failure",
  institutionId: string,
): boolean {
  return outcome === "success" && institutionId.trim() === PREVIEW_UNLOCK_INSTITUTION.id;
}
