/**
 * Shared EduAtlas brand alternate name for WebSite / Organization schema.
 */
export const EDUATLAS_ALTERNATE_NAME = "Türkiye'nin Eğitim Atlası";

/**
 * Topics EduAtlas knows about (Schema.org knowsAbout) — typed, not magic strings at call sites.
 */
export const ORGANIZATION_KNOWS_ABOUT = Object.freeze([
  "Education",
  "Schools",
  "Kindergartens",
  "Private Schools",
  "Language Schools",
  "Tutoring Centers",
  "Educational Directory",
] as const);

export type OrganizationKnowsAboutTopic = (typeof ORGANIZATION_KNOWS_ABOUT)[number];

export const ORGANIZATION_AREA_SERVED = "Turkey" as const;
