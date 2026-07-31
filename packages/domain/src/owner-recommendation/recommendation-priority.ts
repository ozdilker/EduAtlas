/**
 * Priority for owner-facing Sales Agent recommendations.
 */
export enum RecommendationPriority {
  High = "high",
  Medium = "medium",
  Low = "low",
}

const RECOMMENDATION_PRIORITY_VALUES: ReadonlySet<string> = new Set(
  Object.values(RecommendationPriority),
);

/**
 * Returns true when value is a known RecommendationPriority.
 */
export function isRecommendationPriority(value: string): value is RecommendationPriority {
  return RECOMMENDATION_PRIORITY_VALUES.has(value);
}

/**
 * Parses a raw string into RecommendationPriority or throws.
 */
export function parseRecommendationPriority(raw: string): RecommendationPriority {
  const value = raw.trim();
  if (!isRecommendationPriority(value)) {
    throw new Error(`Unknown RecommendationPriority: ${raw}`);
  }
  return value;
}
