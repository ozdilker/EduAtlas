import { describe, expect, it } from "vitest";
import {
  escapeAttribute,
  escapeHtml,
  mailTheme,
  MAIL_LOGO_PATH,
  renderMailDocument,
  renderMailHeader,
  renderMailHero,
  renderMailInfoBox,
  renderMailPrimaryCta,
  renderMailSuccessBox,
  renderMailWarningBox,
  resolveMailLogoUrl,
} from "./index";

describe("mailTheme", () => {
  it("exposes Growth Center brand tokens and 600px container", () => {
    expect(mailTheme.color.brandRed).toBe("#d1272c");
    expect(mailTheme.color.brandTeal).toBe("#0d8a8e");
    expect(mailTheme.layout.maxWidthPx).toBe(600);
    expect(mailTheme.font.family).toContain("Arial");
    expect(mailTheme.font.display).toContain("Georgia");
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
  it("primary CTA uses brand red", () => {
    const html = renderMailPrimaryCta("Open", "https://eduatlas.com.tr");
    expect(html).toContain(mailTheme.color.brandRed);
    expect(html).toContain("Arial");
  });

  it("hero uses teal band and display type", () => {
    const html = renderMailHero({
      eyebrow: "Kurumlar için",
      title: "Sahiplenin",
      body: "Profilinizi yönetin.",
      ctaLabel: "Başla",
      ctaHref: "https://eduatlas.com.tr/register",
    });
    expect(html).toContain(mailTheme.color.brandTeal);
    expect(html).toContain("Georgia");
    expect(html).toContain("Kurumlar için");
  });

  it("info/success/warning boxes use token backgrounds", () => {
    expect(renderMailInfoBox("i")).toContain(mailTheme.color.infoBg);
    expect(renderMailSuccessBox("s")).toContain(mailTheme.color.successBg);
    expect(renderMailWarningBox("w")).toContain(mailTheme.color.warningBg);
  });
});

describe("renderMailDocument", () => {
  it("builds Growth Center 600px shell", () => {
    const { html } = renderMailDocument({
      subject: "S",
      preview: "P",
      bodyHtml: "<tr><td><p>Body</p></td></tr>",
      text: "Body",
    });
    expect(html).toContain("max-width:600px");
    expect(html).toContain(mailTheme.color.brandRed);
    expect(html).toContain(mailTheme.color.brandTeal);
    expect(html).toContain(mailTheme.color.lightGray);
    expect(html).toContain('role="presentation"');
    expect(html).toContain("Türkiye'nin eğitim atlası");
  });

  it("places mark image left of EduAtlas when logoUrl is set", () => {
    const logoUrl = resolveMailLogoUrl("https://eduatlas.com.tr");
    expect(logoUrl).toBe(`https://eduatlas.com.tr${MAIL_LOGO_PATH}`);
    const header = renderMailHeader({
      logoUrl,
    });
    expect(header.indexOf("<img")).toBeLessThan(header.indexOf("Edu"));
    expect(header).toContain(MAIL_LOGO_PATH);
  });
});
