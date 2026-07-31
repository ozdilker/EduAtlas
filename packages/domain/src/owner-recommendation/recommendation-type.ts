/**
 * Recommendation categories for the rule-based Sales Agent.
 */
export enum RecommendationType {
  ContactStaleLead = "contact_stale_lead",
  PrioritizeFollowUp = "prioritize_follow_up",
  ReviewResponseTimes = "review_response_times",
  CompleteProfile = "complete_profile",
  UploadPhotos = "upload_photos",
  AddContactChannel = "add_contact_channel",
  EnrichPrograms = "enrich_programs",
  AddTrustSignals = "add_trust_signals",
}

const RECOMMENDATION_TYPE_VALUES: ReadonlySet<string> = new Set(Object.values(RecommendationType));

/**
 * Returns true when value is a known RecommendationType.
 */
export function isRecommendationType(value: string): value is RecommendationType {
  return RECOMMENDATION_TYPE_VALUES.has(value);
}

/**
 * Parses a raw string into RecommendationType or throws.
 */
export function parseRecommendationType(raw: string): RecommendationType {
  const value = raw.trim();
  if (!isRecommendationType(value)) {
    throw new Error(`Unknown RecommendationType: ${raw}`);
  }
  return value;
}
