/**
 * Lightweight MEB "Kurum Listesi" HTML-as-.xls parser.
 * Avoids SheetJS workbook expansion which OOMs serverless on ~5MB city exports.
 */

const TR_RE = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
const TD_RE = /<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi;
const TAG_RE = /<[^>]+>/g;
const ENTITY_RE = /&(#x?[0-9a-f]+|[a-z]+);/gi;

const NAMED_ENTITIES: Readonly<Record<string, string>> = Object.freeze({
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
});

function decodeHtmlEntities(raw: string): string {
  return raw.replace(ENTITY_RE, (match, entity: string) => {
    const key = entity.toLowerCase();
    if (key.startsWith("#x")) {
      const code = Number.parseInt(key.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    if (key.startsWith("#")) {
      const code = Number.parseInt(key.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return NAMED_ENTITIES[key] ?? match;
  });
}

function cellText(innerHtml: string): string {
  const withoutTags = innerHtml.replace(TAG_RE, " ");
  return decodeHtmlEntities(withoutTags).replace(/\s+/g, " ").trim();
}

/**
 * Parses a single HTML table (MEB export) into a string matrix.
 * Returns [] when no `<tr>` rows are found.
 */
export function parseMebHtmlTable(html: string): string[][] {
  const rows: string[][] = [];
  TR_RE.lastIndex = 0;
  let trMatch: RegExpExecArray | null;
  while ((trMatch = TR_RE.exec(html)) !== null) {
    const rowHtml = trMatch[1] ?? "";
    const cells: string[] = [];
    TD_RE.lastIndex = 0;
    let tdMatch: RegExpExecArray | null;
    while ((tdMatch = TD_RE.exec(rowHtml)) !== null) {
      cells.push(cellText(tdMatch[1] ?? ""));
    }
    if (cells.length > 0 && cells.some((cell) => cell !== "")) {
      rows.push(cells);
    }
  }
  return rows;
}

/**
 * True when the decoded text looks like a MEB/HTML spreadsheet table.
 */
export function looksLikeMebHtmlTable(text: string): boolean {
  const sample = text.trimStart().slice(0, 2048).toLowerCase();
  return (
    (sample.startsWith("<html") ||
      sample.startsWith("<!doctype html") ||
      sample.startsWith("<table")) &&
    sample.includes("<tr")
  );
}
