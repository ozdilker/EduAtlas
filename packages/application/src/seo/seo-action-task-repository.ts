import type { SeoActionTask } from "./seo-action-task";

/** Soft cap for orphan visibility / admin dashboard scans. */
export const SEO_ACTION_TASK_LIST_LIMIT = 500;

/**
 * Persistence port for `seo_action_tasks` (task overlay only).
 */
export interface SeoActionTaskRepository {
  getByFingerprint(fingerprint: string): Promise<SeoActionTask | null>;

  /** Bounded batch get — missing fingerprints omitted. */
  getByFingerprints(fingerprints: readonly string[]): Promise<readonly SeoActionTask[]>;

  /**
   * Bounded collection scan for overlay + orphan visibility.
   * Does not delete; callers must not treat absence from the plan as deletion.
   */
  listAll(limit?: number): Promise<readonly SeoActionTask[]>;

  upsert(task: SeoActionTask): Promise<SeoActionTask>;
}
