import { describe, expect, it } from "vitest";
import {
  parseReindexInstitutionSearchArgs,
  planInstitutionSearchKeywordPatch,
  REINDEX_SEARCH_KEYWORDS_MAX_BATCH,
} from "./reindex-institution-search-keywords";

describe("reindex institution search keywords", () => {
  it("defaults to dry-run and refuses apply when --dry-run is also set", () => {
    expect(parseReindexInstitutionSearchArgs([]).dryRun).toBe(true);
    expect(parseReindexInstitutionSearchArgs([]).apply).toBe(false);
    expect(parseReindexInstitutionSearchArgs(["--apply"]).apply).toBe(true);
    expect(parseReindexInstitutionSearchArgs(["--apply", "--dry-run"]).apply).toBe(false);
    expect(parseReindexInstitutionSearchArgs(["--batch-size", "900"]).batchSize).toBe(
      REINDEX_SEARCH_KEYWORDS_MAX_BATCH,
    );
  });

  it("plans name-only keyword patches and skips idempotent docs", () => {
    const dirty = planInstitutionSearchKeywordPatch({
      id: "inst_1",
      name: "BİLGİ ÖZEL ÖĞRETİM KURSU",
      nameFolded: "bilgi ozel ogretim kursu",
      searchKeywords: ["bilgi", "ozel", "ogretim", "kursu", "bakirkoy", "mah"],
    });
    expect(dirty).toEqual({
      id: "inst_1",
      nameFolded: "bilgi ozel ogretim kursu",
      searchKeywords: ["bilgi"],
    });

    const clean = planInstitutionSearchKeywordPatch({
      id: "inst_1",
      name: "BİLGİ ÖZEL ÖĞRETİM KURSU",
      nameFolded: "bilgi ozel ogretim kursu",
      searchKeywords: ["bilgi"],
    });
    expect(clean).toBeNull();
  });
});
