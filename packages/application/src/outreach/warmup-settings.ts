import {
  DEFAULT_WARMUP_STAGE_LIMITS,
  limitForStage,
  nextWarmupStage,
  parseWarmupStage,
  previousWarmupStage,
  type WarmupStage,
  type WarmupStageLimits,
} from "./warmup-stage";

export type OutreachWarmupHistoryEntry = Readonly<{
  readonly at: string;
  readonly fromStage: WarmupStage;
  readonly toStage: WarmupStage;
  readonly by?: string;
  readonly note?: string;
  readonly recipientCount?: number;
  readonly sent?: number;
  readonly failed?: number;
  readonly bounced?: number;
}>;

export type OutreachWarmupSettings = Readonly<{
  readonly stage: WarmupStage;
  readonly limits: WarmupStageLimits;
  readonly updatedAt: string;
  readonly updatedBy?: string;
  readonly history: readonly OutreachWarmupHistoryEntry[];
}>;

export function createDefaultWarmupSettings(now = new Date().toISOString()): OutreachWarmupSettings {
  return Object.freeze({
    stage: 1,
    limits: DEFAULT_WARMUP_STAGE_LIMITS,
    updatedAt: now,
    history: Object.freeze([]),
  });
}

export function currentWarmupLimit(settings: OutreachWarmupSettings): number {
  return limitForStage(settings.stage, settings.limits);
}

/**
 * Elevates platform warm-up stage by one (admin-only). Returns null if already at max.
 */
export function elevateWarmupSettings(
  settings: OutreachWarmupSettings,
  input: { now: string; by?: string; note?: string; snapshot?: Omit<OutreachWarmupHistoryEntry, "at" | "fromStage" | "toStage" | "by" | "note"> },
): OutreachWarmupSettings | null {
  const toStage = nextWarmupStage(settings.stage);
  if (!toStage) return null;
  return applyWarmupStageChange(settings, toStage, input);
}

/**
 * Lowers platform warm-up stage by one (admin-only). Returns null if already at min.
 */
export function lowerWarmupSettings(
  settings: OutreachWarmupSettings,
  input: { now: string; by?: string; note?: string; snapshot?: Omit<OutreachWarmupHistoryEntry, "at" | "fromStage" | "toStage" | "by" | "note"> },
): OutreachWarmupSettings | null {
  const toStage = previousWarmupStage(settings.stage);
  if (!toStage) return null;
  return applyWarmupStageChange(settings, toStage, input);
}

function applyWarmupStageChange(
  settings: OutreachWarmupSettings,
  toStage: WarmupStage,
  input: { now: string; by?: string; note?: string; snapshot?: Omit<OutreachWarmupHistoryEntry, "at" | "fromStage" | "toStage" | "by" | "note"> },
): OutreachWarmupSettings {
  const fromStage = parseWarmupStage(settings.stage);
  const entry: OutreachWarmupHistoryEntry = Object.freeze({
    at: input.now,
    fromStage,
    toStage,
    ...(input.by ? { by: input.by } : {}),
    ...(input.note ? { note: input.note } : {}),
    ...(input.snapshot ?? {}),
  });
  return Object.freeze({
    stage: toStage,
    limits: settings.limits,
    updatedAt: input.now,
    ...(input.by ? { updatedBy: input.by } : settings.updatedBy ? { updatedBy: settings.updatedBy } : {}),
    history: Object.freeze([...settings.history, entry]),
  });
}
