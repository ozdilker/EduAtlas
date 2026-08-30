import { computeInstitutionSearchIndexFields } from "@eduatlas/domain";

export const REINDEX_SEARCH_KEYWORDS_MAX_BATCH = 400;

export type ReindexInstitutionSearchArgs = Readonly<{
  readonly apply: boolean;
  readonly dryRun: boolean;
  readonly limit: number | null;
  readonly cityId: string | null;
  readonly cursor: string | null;
  readonly batchSize: number;
}>;

export type InstitutionSearchReindexDocument = Readonly<{
  readonly id: string;
  readonly name: string;
  readonly nameFolded?: string;
  readonly searchKeywords?: readonly string[];
}>;

export type InstitutionSearchKeywordPatch = Readonly<{
  readonly id: string;
  readonly nameFolded: string;
  readonly searchKeywords: readonly string[];
}>;

export function parseReindexInstitutionSearchArgs(
  argv: readonly string[],
): ReindexInstitutionSearchArgs {
  const applyFlag = argv.includes("--apply");
  const dryRunFlag = argv.includes("--dry-run");
  const apply = applyFlag && !dryRunFlag;
  return Object.freeze({
    apply,
    dryRun: !apply,
    limit: readNumberFlag(argv, "--limit"),
    cityId: readStringFlag(argv, "--cityId"),
    cursor: readStringFlag(argv, "--cursor"),
    batchSize: Math.min(
      REINDEX_SEARCH_KEYWORDS_MAX_BATCH,
      Math.max(1, readNumberFlag(argv, "--batch-size") ?? REINDEX_SEARCH_KEYWORDS_MAX_BATCH),
    ),
  });
}

export function planInstitutionSearchKeywordPatch(
  document: InstitutionSearchReindexDocument,
): InstitutionSearchKeywordPatch | null {
  const next = computeInstitutionSearchIndexFields(document.name);
  const currentKeywords = document.searchKeywords ?? [];
  const currentFolded = document.nameFolded ?? "";
  if (
    currentFolded === next.nameFolded &&
    searchKeywordsEqual(currentKeywords, next.searchKeywords)
  ) {
    return null;
  }

  return Object.freeze({
    id: document.id,
    nameFolded: next.nameFolded,
    searchKeywords: next.searchKeywords,
  });
}

export function searchKeywordsEqual(
  left: readonly string[],
  right: readonly string[],
): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();
  return sortedLeft.every((token, index) => token === sortedRight[index]);
}

function readStringFlag(argv: readonly string[], name: string): string | null {
  const index = argv.indexOf(name);
  if (index < 0) {
    return null;
  }

  const value = argv[index + 1]?.trim();
  return value && !value.startsWith("--") ? value : null;
}

function readNumberFlag(argv: readonly string[], name: string): number | null {
  const raw = readStringFlag(argv, name);
  if (!raw) {
    return null;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
