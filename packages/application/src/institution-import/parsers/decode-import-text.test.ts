import { describe, expect, it } from "vitest";
import {
  decodeImportTextBytes,
  isTextSpreadsheetPayload,
  isZipPackage,
} from "./decode-import-text";

/** Encode Latin / Turkish text as Windows-1254 bytes. */
function toWindows1254(text: string): Uint8Array {
  const bytes: number[] = [];
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (code < 0x80) {
      bytes.push(code);
      continue;
    }
    let found = 0x3f;
    for (let value = 0x80; value <= 0xff; value += 1) {
      const decoded = new TextDecoder("windows-1254").decode(Uint8Array.of(value));
      if (decoded === char) {
        found = value;
        break;
      }
    }
    bytes.push(found);
  }
  return Uint8Array.from(bytes);
}

describe("decodeImportTextBytes", () => {
  it("keeps UTF-8 Turkish characters", () => {
    const text = "ÖZEL HEYBELİADA RUM ERKEK LİSESİ";
    const decoded = decodeImportTextBytes(new TextEncoder().encode(text));
    expect(decoded).toBe(text);
  });

  it("recovers Windows-1254 Turkish characters instead of replacement marks", () => {
    const text =
      "ÖZEL HEYBELİADA RUM ERKEK LİSESİ\nARNAVUTKÖY BEŞ YILDIZ ÖZEL ÖĞRETİM KURSU";
    const bytes = toWindows1254(text);
    const utf8Misread = new TextDecoder("utf-8").decode(bytes);
    expect(utf8Misread).toContain("\uFFFD");

    const decoded = decodeImportTextBytes(bytes);
    expect(decoded).toBe(text);
    expect(decoded).not.toContain("\uFFFD");
  });

  it("detects HTML-as-xls payloads", () => {
    const html = "<html><table><tr><td>Kurum Adı</td></tr></table></html>";
    expect(isTextSpreadsheetPayload(toWindows1254(html))).toBe(true);
    expect(isZipPackage(new Uint8Array([0x50, 0x4b, 0x03, 0x04]))).toBe(true);
  });
});
