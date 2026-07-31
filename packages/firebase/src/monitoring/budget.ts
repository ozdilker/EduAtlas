import { getFirestoreCounters } from "./firestore-counter";

export type PerformanceBudgetPage =
  | "home"
  | "city"
  | "detail";

const DEFAULT_MAX_READS: Readonly<Record<PerformanceBudgetPage, number>> = Object.freeze({
  // Homepage featured completeness ranking loads a candidate pool + getById.
  home: 120,
  city: 15,
  detail: 20,
});

/**
 * Dev-only performance budget assertion.
 *
 * - Warns in development when reads exceed budget.
 * - No-op in production.
 */
export function assertFirestoreReadsBudget(page: PerformanceBudgetPage): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  const { reads } = getFirestoreCounters();
  const max = DEFAULT_MAX_READS[page];

  if (reads > max) {
    // eslint-disable-next-line no-console
    console.warn(
      `[eduatlas][budget] Firestore reads budget exceeded for "${page}": ${reads} > ${max}`,
    );
  }
}

