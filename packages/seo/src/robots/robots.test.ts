import { describe, expect, it } from "vitest";
import { isRobotsCrawlAllowed } from "./environment";
import { buildRobotsTxt, toRobotsMetadataDocument } from "./generator";
import {
  createBlockedRobotsPolicy,
  createProductionRobotsPolicy,
  resolveRobotsPolicy,
} from "./policies";

const siteUrl = "https://eduatlas.com.tr";

describe("isRobotsCrawlAllowed", () => {
  it("allows only explicit truthy flags", () => {
    expect(isRobotsCrawlAllowed("true")).toBe(true);
    expect(isRobotsCrawlAllowed("1")).toBe(true);
    expect(isRobotsCrawlAllowed("yes")).toBe(true);
    expect(isRobotsCrawlAllowed("on")).toBe(true);
    expect(isRobotsCrawlAllowed("TRUE")).toBe(true);
  });

  it("blocks empty, false, and unknown values", () => {
    expect(isRobotsCrawlAllowed(undefined)).toBe(false);
    expect(isRobotsCrawlAllowed(null)).toBe(false);
    expect(isRobotsCrawlAllowed("")).toBe(false);
    expect(isRobotsCrawlAllowed("false")).toBe(false);
    expect(isRobotsCrawlAllowed("production")).toBe(false);
  });
});

describe("resolveRobotsPolicy", () => {
  it("blocks everything when crawl is not allowed", () => {
    const txt = buildRobotsTxt(resolveRobotsPolicy(false), { siteUrl });
    expect(txt).toContain("User-agent: *");
    expect(txt).toContain("Disallow: /");
    expect(txt).not.toContain("Sitemap:");
    expect(txt).not.toContain("Allow:");
  });

  it("emits production allow, private disallows, and sitemap index only", () => {
    const txt = buildRobotsTxt(resolveRobotsPolicy(true), { siteUrl });
    expect(txt).toContain("Allow: /");
    expect(txt).toContain("Disallow: /admin");
    expect(txt).toContain("Disallow: /owner");
    expect(txt).toContain("Disallow: /login");
    expect(txt).toContain("Disallow: /api");
    expect(txt).toContain("Sitemap: https://eduatlas.com.tr/sitemap.xml");
    expect(txt).not.toContain("/sitemaps/");
    expect(txt).not.toContain("Host:");
    expect(txt).not.toContain("Disallow: /search");
  });
});

describe("createProductionRobotsPolicy", () => {
  it("supports appending disallow paths without generator changes", () => {
    const policy = createProductionRobotsPolicy(["/admin", "/custom-bot-trap"]);
    const txt = buildRobotsTxt(policy, { siteUrl });
    expect(txt).toContain("Disallow: /custom-bot-trap");
    expect(txt).not.toContain("Disallow: /owner");
  });
});

describe("toRobotsMetadataDocument", () => {
  it("maps blocked policy for Next MetadataRoute", () => {
    const doc = toRobotsMetadataDocument(createBlockedRobotsPolicy(), { siteUrl });
    expect(doc.rules).toHaveLength(1);
    expect(doc.rules[0]?.disallow).toBe("/");
    expect(doc.sitemap).toBeUndefined();
  });

  it("maps production policy with sitemap absolute URL", () => {
    const doc = toRobotsMetadataDocument(createProductionRobotsPolicy(), { siteUrl });
    expect(doc.sitemap).toBe("https://eduatlas.com.tr/sitemap.xml");
    expect(doc.rules[0]?.allow).toBe("/");
    expect(Array.isArray(doc.rules[0]?.disallow)).toBe(true);
  });
});
