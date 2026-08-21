import { describe, expect, it } from "vitest";
import {
  parseOutreachRecipientImport,
  sanitizeOutreachImportCell,
} from "./import-campaign-recipients";
import { buildExternalInstitutionId } from "@eduatlas/domain";

function csvBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

describe("sanitizeOutreachImportCell", () => {
  it("strips formula injection prefixes and HTML", () => {
    expect(sanitizeOutreachImportCell("=HYPERLINK(\"x\")")).toBe('HYPERLINK("x")');
    expect(sanitizeOutreachImportCell("<b>Okul</b>")).toBe("Okul");
  });
});

describe("parseOutreachRecipientImport", () => {
  it("accepts institutionName + email and dedupes emails", () => {
    const parse = parseOutreachRecipientImport({
      fileName: "alici.csv",
      content: csvBytes(
        "institutionName,email\nOkul A,a@example.com\nOkul B,a@example.com\nOkul C,c@example.com\n,bad\n",
      ),
    });
    expect(parse.accepted).toHaveLength(2);
    expect(parse.duplicateEmailCount).toBe(1);
    expect(parse.rejected.length).toBeGreaterThanOrEqual(1);
    expect(parse.accepted[0]?.institutionId).toBe(
      buildExternalInstitutionId("a@example.com"),
    );
  });

  it("rejects unsupported extensions", () => {
    expect(() =>
      parseOutreachRecipientImport({
        fileName: "alici.xls",
        content: csvBytes("institutionName,email\nA,a@example.com\n"),
      }),
    ).toThrow(/csv|xlsx/i);
  });

  it("accepts Turkish header aliases", () => {
    const parse = parseOutreachRecipientImport({
      fileName: "liste.csv",
      content: csvBytes("Kurum Adı,E-posta\nDemo Okul,demo@eduatlas.com\n"),
    });
    expect(parse.accepted).toHaveLength(1);
    expect(parse.accepted[0]?.institutionName).toBe("Demo Okul");
  });
});
