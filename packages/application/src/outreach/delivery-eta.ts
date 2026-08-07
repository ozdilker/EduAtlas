/**
 * ETA minutes from remaining actionable jobs and emails-per-minute rate.
 */
export function estimateDeliveryEtaMinutes(
  remaining: number,
  ratePerMinute: number,
): number {
  const left = Math.max(0, remaining);
  const rate = ratePerMinute > 0 ? ratePerMinute : 1;
  if (left === 0) return 0;
  return Math.ceil(left / rate);
}

/**
 * Remaining jobs that still need a successful send outcome.
 */
export function remainingDeliveryJobs(progress: {
  total: number;
  sent: number;
  failed: number;
  bounced: number;
  cancelled?: number;
}): number {
  const done =
    progress.sent +
    progress.failed +
    progress.bounced +
    Math.max(0, progress.cancelled ?? 0);
  return Math.max(0, progress.total - done);
}
