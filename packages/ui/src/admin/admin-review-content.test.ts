import { describe, expect, it } from "vitest";
import {
  buildAdminReviewHref,
  buildAdminReviewQueueTabs,
  getAdminReviewQueueLabel,
} from "./admin-review-content";

const FILTERS = {
  cityId: "city_ankara",
  districtId: "",
  primaryType: "dershane",
  qualityBand: "low",
  status: "",
};

describe("admin review content helpers", () => {
  it("labels the five review queues", () => {
    expect(getAdminReviewQueueLabel("draft")).toBe("Taslak kuyruğu");
    expect(getAdminReviewQueueLabel("needs_review")).toBe("İnceleme bekleyen");
    expect(getAdminReviewQueueLabel("ready")).toBe("Yayına hazır");
    expect(getAdminReviewQueueLabel("published")).toBe("Yayında");
    expect(getAdminReviewQueueLabel("rejected")).toBe("Reddedilen");
  });

  it("builds hrefs preserving filters, sort, search, and selection", () => {
    const href = buildAdminReviewHref({
      queue: "ready",
      sort: "lowest",
      filters: FILTERS,
      searchQuery: "anaokulu",
      selectedId: "inst_1",
    });
    expect(href).toContain("queue=ready");
    expect(href).toContain("sort=lowest");
    expect(href).toContain("cityId=city_ankara");
    expect(href).toContain("qualityBand=low");
    expect(href).toContain("q=anaokulu");
    expect(href).toContain("selected=inst_1");

    expect(
      buildAdminReviewHref({
        queue: "draft",
        sort: "newest",
        filters: { cityId: "", districtId: "", primaryType: "", qualityBand: "", status: "" },
        searchQuery: "",
      }),
    ).toBe("/admin/review");
  });

  it("builds queue tabs with counts", () => {
    const tabs = buildAdminReviewQueueTabs({
      activeQueue: "draft",
      queueCounts: { draft: 5, needs_review: 2, ready: 3, published: 10, rejected: 1 },
      sort: "newest",
      filters: FILTERS,
      searchQuery: "",
    });
    expect(tabs).toHaveLength(5);
    expect(tabs.find((tab) => tab.id === "ready")?.count).toBe(3);
    expect(tabs.find((tab) => tab.id === "rejected")?.href).toContain("queue=rejected");
  });
});
