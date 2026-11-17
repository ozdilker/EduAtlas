import type { SeoActionItem, SeoActionPlan } from "./seo-actions";
import {
  SeoActionTaskStatus,
  defaultSeoActionTaskView,
  toSeoActionTaskView,
  type SeoActionTask,
  type SeoActionTaskView,
} from "./seo-action-task";

export type SeoManagedActionItem = SeoActionItem &
  Readonly<{
    readonly task: SeoActionTaskView;
  }>;

/** Persisted task no longer present in the current derived SEO action plan. */
export type SeoOrphanedActionTask = Readonly<{
  readonly fingerprint: string;
  readonly sourceKey: string;
  readonly title: string;
  readonly targetLabel: string;
  readonly task: SeoActionTaskView;
}>;

export type SeoManagedActionPlan = Readonly<{
  readonly activeActions: readonly SeoManagedActionItem[];
  readonly completedActions: readonly SeoManagedActionItem[];
  readonly prioritizedActions: readonly SeoManagedActionItem[];
  readonly ctrPageOpportunities: readonly SeoManagedActionItem[];
  readonly rankingPageOpportunities: readonly SeoManagedActionItem[];
  readonly queryOpportunities: readonly SeoManagedActionItem[];
  readonly unmatchedUrlOpportunities: readonly SeoManagedActionItem[];
  readonly orphanedTasks: readonly SeoOrphanedActionTask[];
}>;

function attachTask(
  action: SeoActionItem,
  byFingerprint: Map<string, SeoActionTask>,
): SeoManagedActionItem {
  const existing = byFingerprint.get(action.fingerprint);
  return Object.freeze({
    ...action,
    task: existing ? toSeoActionTaskView(existing) : defaultSeoActionTaskView(),
  });
}

function mapList(
  actions: readonly SeoActionItem[],
  byFingerprint: Map<string, SeoActionTask>,
): readonly SeoManagedActionItem[] {
  return Object.freeze(actions.map((action) => attachTask(action, byFingerprint)));
}

function planFingerprintSet(plan: SeoActionPlan): Set<string> {
  return new Set(
    [
      ...plan.prioritizedActions,
      ...plan.ctrPageOpportunities,
      ...plan.rankingPageOpportunities,
      ...plan.queryOpportunities,
      ...plan.unmatchedUrlOpportunities,
    ].map((action) => action.fingerprint),
  );
}

export function orphanTargetLabelFromSourceKey(sourceKey: string): string {
  if (sourceKey.startsWith("url:")) return sourceKey.slice(4) || sourceKey;
  if (sourceKey.startsWith("query:")) return sourceKey.slice(6) || sourceKey;
  return sourceKey;
}

function toOrphanedActionTask(task: SeoActionTask): SeoOrphanedActionTask {
  return Object.freeze({
    fingerprint: task.fingerprint,
    sourceKey: task.sourceKey,
    title: "Güncel olmayan görev",
    targetLabel: orphanTargetLabelFromSourceKey(task.sourceKey),
    task: toSeoActionTaskView(task),
  });
}

/**
 * Overlays persisted task state onto derived SEO actions.
 * Missing tasks default to pending. Orphaned Firestore tasks are listed separately
 * and are never deleted by merge.
 */
export function mergeSeoActionTasks(
  plan: SeoActionPlan,
  tasks: readonly SeoActionTask[],
): SeoManagedActionPlan {
  const byFingerprint = new Map(tasks.map((task) => [task.fingerprint, task]));

  const prioritizedActions = mapList(plan.prioritizedActions, byFingerprint);
  const ctrPageOpportunities = mapList(plan.ctrPageOpportunities, byFingerprint);
  const rankingPageOpportunities = mapList(plan.rankingPageOpportunities, byFingerprint);
  const queryOpportunities = mapList(plan.queryOpportunities, byFingerprint);
  const unmatchedUrlOpportunities = mapList(
    plan.unmatchedUrlOpportunities,
    byFingerprint,
  );

  const activeActions = Object.freeze(
    prioritizedActions.filter((action) => action.task.status !== SeoActionTaskStatus.Done),
  );
  const completedActions = Object.freeze(
    prioritizedActions.filter((action) => action.task.status === SeoActionTaskStatus.Done),
  );

  const currentFingerprints = planFingerprintSet(plan);
  const orphanedTasks = Object.freeze(
    tasks
      .filter((task) => !currentFingerprints.has(task.fingerprint))
      .map(toOrphanedActionTask),
  );

  return Object.freeze({
    activeActions,
    completedActions,
    prioritizedActions,
    ctrPageOpportunities,
    rankingPageOpportunities,
    queryOpportunities,
    unmatchedUrlOpportunities,
    orphanedTasks,
  });
}

export const EMPTY_SEO_MANAGED_ACTION_PLAN: SeoManagedActionPlan = Object.freeze({
  activeActions: Object.freeze([]),
  completedActions: Object.freeze([]),
  prioritizedActions: Object.freeze([]),
  ctrPageOpportunities: Object.freeze([]),
  rankingPageOpportunities: Object.freeze([]),
  queryOpportunities: Object.freeze([]),
  unmatchedUrlOpportunities: Object.freeze([]),
  orphanedTasks: Object.freeze([]),
});
