import { buildCanonical } from "../canonical";
import type {
  BuildRobotsTxtOptions,
  RobotsMetadataDocument,
  RobotsMetadataRules,
  RobotsPolicy,
} from "./types";

/**
 * Serializes a robots policy to robots.txt body text.
 */
export function buildRobotsTxt(policy: RobotsPolicy, options: BuildRobotsTxtOptions): string {
  const lines: string[] = [];

  for (const group of policy.groups) {
    if (lines.length > 0) {
      lines.push("");
    }
    lines.push(`User-agent: ${group.userAgent}`);
    for (const rule of group.rules) {
      const directive = rule.type === "allow" ? "Allow" : "Disallow";
      lines.push(`${directive}: ${rule.path}`);
    }
  }

  if (policy.sitemapPath) {
    lines.push("");
    lines.push(`Sitemap: ${buildCanonical(options.siteUrl, policy.sitemapPath)}`);
  }

  lines.push("");
  return lines.join("\n");
}

/**
 * Maps a policy to Next.js `MetadataRoute.Robots`-compatible shape.
 */
export function toRobotsMetadataDocument(
  policy: RobotsPolicy,
  options: BuildRobotsTxtOptions,
): RobotsMetadataDocument {
  const rules: RobotsMetadataRules[] = policy.groups.map((group) => {
    const allow = group.rules.filter((r) => r.type === "allow").map((r) => r.path);
    const disallow = group.rules.filter((r) => r.type === "disallow").map((r) => r.path);
    return Object.freeze({
      userAgent: group.userAgent,
      ...(allow.length > 0 ? { allow: allow.length === 1 ? allow[0] : allow } : {}),
      ...(disallow.length > 0
        ? { disallow: disallow.length === 1 ? disallow[0] : disallow }
        : {}),
    });
  });

  return Object.freeze({
    rules: Object.freeze(rules),
    ...(policy.sitemapPath
      ? { sitemap: buildCanonical(options.siteUrl, policy.sitemapPath) }
      : {}),
  });
}
