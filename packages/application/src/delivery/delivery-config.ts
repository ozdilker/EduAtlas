export type OutreachDeliveryConfig = Readonly<{
  readonly warmupBatchSize: number;
  readonly ratePerMinute: number;
  readonly dailySendLimit: number;
  readonly retryDelayMs: number;
  readonly maxAttempts: number;
  readonly workerInstanceId: string;
  readonly lockTtlMs: number;
}>;

function positiveInt(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw.trim() === "") return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * Loads outreach delivery knobs from env with safe defaults.
 */
export function loadOutreachDeliveryConfig(
  env: NodeJS.ProcessEnv = process.env,
): OutreachDeliveryConfig {
  const workerInstanceId =
    env.OUTREACH_WORKER_INSTANCE_ID?.trim() ||
    `worker_${process.pid}_${Math.random().toString(36).slice(2, 8)}`;

  return Object.freeze({
    warmupBatchSize: positiveInt(env.OUTREACH_WARMUP_BATCH_SIZE, 20),
    ratePerMinute: positiveInt(env.OUTREACH_RATE_PER_MINUTE, 10),
    dailySendLimit: positiveInt(env.OUTREACH_DAILY_SEND_LIMIT, 100),
    retryDelayMs: positiveInt(env.OUTREACH_RETRY_DELAY_MS, 3_600_000),
    maxAttempts: positiveInt(env.OUTREACH_MAX_ATTEMPTS, 3),
    workerInstanceId,
    lockTtlMs: positiveInt(env.OUTREACH_LOCK_TTL_MS, 300_000),
  });
}
