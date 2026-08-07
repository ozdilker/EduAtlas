/** Platform warm-up stages (GROWTH-002). */
export const WARMUP_STAGE = Object.freeze({
  One: 1,
  Two: 2,
  Three: 3,
  Four: 4,
} as const);

export type WarmupStage = (typeof WARMUP_STAGE)[keyof typeof WARMUP_STAGE];

export const DEFAULT_WARMUP_STAGE_LIMITS = Object.freeze({
  1: 20,
  2: 50,
  3: 100,
  4: 250,
} as const);

export type WarmupStageLimits = Readonly<{
  readonly 1: number;
  readonly 2: number;
  readonly 3: number;
  readonly 4: number;
}>;

export function isWarmupStage(value: number): value is WarmupStage {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

export function parseWarmupStage(raw: number): WarmupStage {
  if (!isWarmupStage(raw)) {
    throw new Error(`Unknown warm-up stage: ${raw}`);
  }
  return raw;
}

/**
 * Recipient/job cap for a platform warm-up stage.
 */
export function limitForStage(
  stage: number,
  limits: WarmupStageLimits = DEFAULT_WARMUP_STAGE_LIMITS,
): number {
  const s = parseWarmupStage(stage);
  return limits[s];
}

export function nextWarmupStage(stage: number): WarmupStage | null {
  const s = parseWarmupStage(stage);
  if (s >= 4) return null;
  return (s + 1) as WarmupStage;
}
