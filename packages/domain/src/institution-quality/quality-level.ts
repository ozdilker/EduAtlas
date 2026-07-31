/**
 * Operating quality bands aligned with DATA-ACQUISITION thresholds.
 */
export enum QualityLevel {
  Critical = "critical",
  NeedsWork = "needs_work",
  Healthy = "healthy",
  Excellent = "excellent",
}

const LEVEL_VALUES: ReadonlySet<string> = new Set(Object.values(QualityLevel));

export function isQualityLevel(value: string): value is QualityLevel {
  return LEVEL_VALUES.has(value);
}

export function parseQualityLevel(raw: string): QualityLevel {
  const value = raw.trim();
  if (!isQualityLevel(value)) {
    throw new Error(`Unknown QualityLevel: ${raw}`);
  }
  return value;
}

/**
 * Maps a 0–100 score to QualityLevel.
 * <40 critical · 40–69 needs_work · 70–84 healthy · ≥85 excellent
 */
export function qualityLevelFromScore(score: number): QualityLevel {
  if (score < 40) return QualityLevel.Critical;
  if (score < 70) return QualityLevel.NeedsWork;
  if (score < 85) return QualityLevel.Healthy;
  return QualityLevel.Excellent;
}
