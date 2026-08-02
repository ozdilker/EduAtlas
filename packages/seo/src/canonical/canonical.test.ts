import { describe, expect, it } from "vitest";
import {
  CANONICAL_CONTENT_QUERY_ALLOWLIST,
  CanonicalResolver,
  buildCanonical,
  isCanonicalTrackingQueryKey,
  resolveCanonical,
} from "./index";
import { buildMetadata } from "../metadata";
import { createSeoSiteConfig } from "../site";

const site = createSeoSiteConfig({
  siteName: "EduAtlas",
  siteUrl: "https://eduatlas.com",
});

describe("CanonicalResolver", () => {
  it("preserves path-only absolute URLs (default strip-all queries)", () => {
    expect(
      CanonicalResolver.resolve({
        siteUrl: "https://eduatlas.com/",
        path: "/cities/istanbul/",
      }),
    ).toBe("https://eduatlas.com/cities/istanbul");
    expect(resolveCanonical({ siteUrl: "https://eduatlas.com", path: "/" })).toBe(
      "https://eduatlas.com/",
    );
  });

  it("strips tracking and arbitrary query noise by default", () => {
    expect(
      resolveCanonical({
        siteUrl: "https://eduatlas.com",
        path: "/search?q=anaokulu&utm_source=google&gclid=abc#results",
      }),
    ).toBe("https://eduatlas.com/search");
  });

  it("ignores searchParams unless allowQueryKeys is activated", () => {
    expect(
      resolveCanonical({
        siteUrl: "https://eduatlas.com",
        path: "/search",
        searchParams: { q: "anaokulu", page: "2", utm_source: "x" },
      }),
    ).toBe("https://eduatlas.com/search");
  });

  it("supports future allowlist without letting tracking through", () => {
    expect(CANONICAL_CONTENT_QUERY_ALLOWLIST).toContain("page");
    expect(
      resolveCanonical({
        siteUrl: "https://eduatlas.com",
        path: "/institutions",
        searchParams: { page: "2", utm_campaign: "spring", sort: "name" },
        allowQueryKeys: CANONICAL_CONTENT_QUERY_ALLOWLIST,
      }),
    ).toBe("https://eduatlas.com/institutions?page=2");
  });

  it("buildCanonical delegates to the resolver", () => {
    expect(buildCanonical("https://eduatlas.com", "/about?ref=nav")).toBe(
      "https://eduatlas.com/about",
    );
  });
});

describe("isCanonicalTrackingQueryKey", () => {
  it("flags utm_* and known attribution keys", () => {
    expect(isCanonicalTrackingQueryKey("utm_source")).toBe(true);
    expect(isCanonicalTrackingQueryKey("GCLID")).toBe(true);
    expect(isCanonicalTrackingQueryKey("page")).toBe(false);
  });
});

describe("buildMetadata canonical integration", () => {
  it("uses CanonicalResolver for alternates and Open Graph url", () => {
    const metadata = buildMetadata({
      site,
      title: ["Test"],
      description: "Açıklama metni burada yeterince uzun.",
      path: "/cities/ankara?utm_medium=email",
    });
    expect(metadata.alternates.canonical).toBe("https://eduatlas.com/cities/ankara");
    expect(metadata.openGraph.url).toBe("https://eduatlas.com/cities/ankara");
  });
});
