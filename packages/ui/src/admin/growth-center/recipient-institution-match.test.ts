import { describe, expect, it } from "vitest";
import {
  buildOutreachInstitutionSearchUrl,
  formatOutreachInstitutionLocation,
  formatOutreachMatchedLabel,
} from "./recipient-institution-match";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

describe("GROWTH-007 FIX institution match UI helpers", () => {
  it("does not ask admin for raw inst_id in match / growth-center UI source", () => {
    const matchSrc = readFileSync(join(here, "recipient-institution-match.tsx"), "utf8");
    const pageSrc = readFileSync(join(here, "growth-center-page.tsx"), "utf8");
    expect(matchSrc.includes('placeholder="inst_id"')).toBe(false);
    expect(matchSrc.includes("placeholder=\"inst_…\"")).toBe(false);
    expect(pageSrc.includes('placeholder="inst_id"')).toBe(false);
    expect(pageSrc.includes("EduAtlas kurum ID")).toBe(false);
    expect(pageSrc.includes("RecipientInstitutionMatchPanel")).toBe(true);
    expect(pageSrc.includes("ManualInstitutionPicker")).toBe(true);
  });

  it("Seç form binds assignAction directly with campaign + recipient + institution ids", () => {
    const matchSrc = readFileSync(join(here, "recipient-institution-match.tsx"), "utf8");
    expect(matchSrc).toContain("action={assignAction}");
    expect(matchSrc).toContain('name="campaignId"');
    expect(matchSrc).toContain('name="recipientId"');
    expect(matchSrc).toContain('name="institutionId"');
    expect(matchSrc).toContain("value={recipientId}");
    expect(matchSrc).toContain("value={item.id}");
    expect(matchSrc.includes("startTransition")).toBe(false);
  });

  it("builds bounded search URL from recipient institutionName", () => {
    const url = buildOutreachInstitutionSearchUrl({
      query: "Kadro Kurs",
      cityId: "istanbul",
      districtId: "bakirkoy",
      candidateIds: ["inst_a", "inst_b"],
      limit: 8,
    });
    expect(url.startsWith("/api/admin/outreach-institution-search?")).toBe(true);
    expect(url).toContain("q=Kadro+Kurs");
    expect(url).toContain("cityId=istanbul");
    expect(url).toContain("districtId=bakirkoy");
    expect(url).toContain("ids=inst_a%2Cinst_b");
    expect(url).toContain("limit=8");
  });

  it("formats matched label for preview column", () => {
    expect(
      formatOutreachMatchedLabel(
        "Kadro Kurs",
        formatOutreachInstitutionLocation({
          cityId: "istanbul",
          districtId: "bakirkoy",
          cityName: "İstanbul",
          districtName: "Bakırköy",
        }),
      ),
    ).toBe("Kadro Kurs — İstanbul / Bakırköy");
  });
});
