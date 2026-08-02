import type { RobotsPathRule, RobotsPolicy } from "./types";

/**
 * Production Disallow prefixes for private / non-indexable surfaces.
 * Append new paths here without changing the generator.
 */
export const DEFAULT_PRODUCTION_DISALLOW_PATHS: readonly string[] = Object.freeze([
  "/admin",
  "/owner",
  "/login",
  "/register",
  "/forgot-password",
  "/veli",
  "/claim",
  "/api",
  "/preview",
  "/test",
  "/health",
]);

function disallowRules(paths: readonly string[]): readonly RobotsPathRule[] {
  return Object.freeze(paths.map((path) => Object.freeze({ type: "disallow" as const, path })));
}

/**
 * Crawl-allowed production policy: Allow public tree, Disallow private prefixes, sitemap index.
 */
export function createProductionRobotsPolicy(
  disallowPaths: readonly string[] = DEFAULT_PRODUCTION_DISALLOW_PATHS,
): RobotsPolicy {
  return Object.freeze({
    groups: Object.freeze([
      Object.freeze({
        userAgent: "*",
        rules: Object.freeze([
          Object.freeze({ type: "allow" as const, path: "/" }),
          ...disallowRules(disallowPaths),
        ]),
      }),
    ]),
    sitemapPath: "/sitemap.xml",
  });
}

/**
 * Fully blocked policy for non-allowlisted environments.
 */
export function createBlockedRobotsPolicy(): RobotsPolicy {
  return Object.freeze({
    groups: Object.freeze([
      Object.freeze({
        userAgent: "*",
        rules: Object.freeze([Object.freeze({ type: "disallow" as const, path: "/" })]),
      }),
    ]),
  });
}

/**
 * Resolves the active policy from the crawl-allow flag.
 */
export function resolveRobotsPolicy(allowRobots: boolean): RobotsPolicy {
  return allowRobots ? createProductionRobotsPolicy() : createBlockedRobotsPolicy();
}
