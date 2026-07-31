import { cache } from "react";

/**
 * Request-scoped memoization helper.
 *
 * When used inside Next.js server rendering, React's cache is cleared per request,
 * so identical Firestore reads aren't repeated within the same render pass.
 */
export function requestCacheAsync<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
): (...args: TArgs) => Promise<TResult> {
  return cache(fn);
}

