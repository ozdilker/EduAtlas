import { describe, expect, it } from "vitest";
import { looksLikeMebHtmlTable, parseMebHtmlTable } from "./meb-html-table-parser";

describe("parseMebHtmlTable", () => {
  it("extracts header and data rows from MEB-style HTML", () => {
    const html = `<html><meta charset=windows-1254><table>
      <tr><td colspan="3">KURUMLAR LİSTE</td></tr>
      <tr><td>IL_ADI</td><td>ILCE_ADI</td><td>KURUM_ADI</td></tr>
      <tr><td><b><font>İSTANBUL</font></b></td><td><b>ADALAR</b></td><td><b>ÖZEL OKUL</b></td></tr>
    </table></html>`;

    const rows = parseMebHtmlTable(html);
    expect(rows).toHaveLength(3);
    expect(rows[1]).toEqual(["IL_ADI", "ILCE_ADI", "KURUM_ADI"]);
    expect(rows[2]).toEqual(["İSTANBUL", "ADALAR", "ÖZEL OKUL"]);
  });

  it("decodes basic HTML entities", () => {
    const rows = parseMebHtmlTable("<table><tr><td>A&amp;B &lt;C&gt;</td></tr></table>");
    expect(rows[0]?.[0]).toBe("A&B <C>");
  });

  it("detects MEB HTML samples", () => {
    expect(looksLikeMebHtmlTable("<html><table><tr><td>x</td></tr></table></html>")).toBe(true);
    expect(looksLikeMebHtmlTable("name,city\nA,B")).toBe(false);
  });
});
