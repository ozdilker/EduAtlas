/**
 * Minimal RFC 4180 CSV parser (quotes, escaped quotes, CRLF, commas in quotes).
 */
export function parseCsvTable(text: string): string[][] {
  const source = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;
  let index = 0;

  const pushCell = () => {
    currentRow.push(currentCell);
    currentCell = "";
  };
  const pushRow = () => {
    pushCell();
    rows.push(currentRow);
    currentRow = [];
  };

  while (index < source.length) {
    const char = source[index];

    if (inQuotes) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          currentCell += '"';
          index += 2;
          continue;
        }
        inQuotes = false;
        index += 1;
        continue;
      }
      currentCell += char;
      index += 1;
      continue;
    }

    if (char === '"' && currentCell === "") {
      inQuotes = true;
      index += 1;
      continue;
    }
    if (char === ",") {
      pushCell();
      index += 1;
      continue;
    }
    if (char === "\r") {
      index += 1;
      continue;
    }
    if (char === "\n") {
      pushRow();
      index += 1;
      continue;
    }
    currentCell += char;
    index += 1;
  }

  if (currentCell !== "" || currentRow.length > 0) {
    pushRow();
  }

  return rows.filter((row) => row.some((cell) => cell.trim() !== ""));
}
