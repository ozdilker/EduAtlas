import { describe, expect, it } from "vitest";
import {
  escapeAttribute,
  escapeHtml,
  mailTheme,
  MAIL_LOGO_PATH,
  renderMailDocument,
  renderMailHeader,
  renderMailInfoBox,
  renderMailPrimaryCta,
  renderMailSuccessBox,
  renderMailWarningBox,
  resolveMailLogoUrl,
} from "./index";

describe("mailTheme", () => {
  it("exposes brand red and 600px container", () => {
    expect(mailTheme.color.brandRed).toBe("#e62846");
    expect(mailTheme.color.brandNavy).toBe("#0f172a");
    expect(mailTheme.layout.maxWidthPx).toBe(600);
    expect(mailTheme.font.family).toContain("Arial");
    expect(mailTheme.cta.minHeightPx).toBeGreaterThanOrEqual(44);
  });
});

describe("escapeHtml", () => {
  it("escapes markup", () => {
    expect(escapeHtml(`<a href="x"> & '`)).toContain("&lt;");
    expect(escapeAttribute(`O'Brien`)).toContain("&#39;");
  });
});

describe("components", () => {
  it("primary CTA uses brand red and min height", () => {
    const html = renderMailPrimaryCta("Open", "https://eduatlas.com.tr");
    expect(html).toContain(mailTheme.color.brandRed);
    expect(html).toContain(`min-height:${mailTheme.cta.minHeightPx}px`);
    expect(html).toContain("Arial");
  });

  it("info/success/warning boxes use token backgrounds", () => {
    expect(renderMailInfoBox("i")).toContain(mailTheme.color.infoBg);
    expect(renderMailSuccessBox("s")).toContain(mailTheme.color.successBg);
    expect(renderMailWarningBox("w")).toContain(mailTheme.color.warningBg);
  });
});

describe("renderMailDocument", () => {
  it("builds 600px shell without legacy teal/Georgia", () => {
    const { html } = renderMailDocument({
      subject: "S",
      preview: "P",
      bodyHtml: "<p>Body</p>",
      text: "Body",
    });
    expect(html).toContain("max-width:600px");
    expect(html).toContain(mailTheme.color.brandRed);
    expect(html).toContain('role="presentation"');
    expect(html).not.toContain("Georgia");
    expect(html).not.toContain("#0f766e");
  });

  it("places mark image left of EduAtlas + badge when logoUrl is set", () => {
    const logoUrl = resolveMailLogoUrl("https://eduatlas.com.tr");
    expect(logoUrl).toBe(`https://eduatlas.com.tr${MAIL_LOGO_PATH}`);
    const header = renderMailHeader({
      badge: "Kurum daveti",
      logoUrl,
    });
    expect(header.indexOf("<img")).toBeLessThan(header.indexOf("Edu"));
    expect(header).toContain(MAIL_LOGO_PATH);
    expect(header).toContain("Kurum daveti");
  });
});
