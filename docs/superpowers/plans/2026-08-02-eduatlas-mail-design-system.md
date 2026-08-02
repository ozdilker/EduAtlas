# EduAtlas Mail Design System (EMDS) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a token-driven, component-based HTML email design system under `packages/application/src/mail-design/` and route existing transactional `renderEmailTemplate` output through it without changing mail content, SMTP, or claim logic.

**Architecture:** Theme tokens → table layout (600px) → pure HTML component functions → `renderMailDocument` → existing `renderEmailTemplate` / `renderNotificationEmail` adapters. Inline styles only; system fonts; no images.

**Tech Stack:** TypeScript, Vitest, existing `@eduatlas/application` notifications module (no new packages, no MJML/React Email).

## Global Constraints

- Placement: `packages/application/src/mail-design/` only (Option A).
- Max container width: **600px**.
- No images, external CSS, external fonts, animation, icon libraries.
- Font stack: `Arial, Helvetica, sans-serif`.
- Colors/spacing/radius/shadow via theme tokens only (no magic values in components).
- Outlook/Gmail/Apple Mail/Yahoo: table-based `role="presentation"` markup.
- CTA min-height ≥ **44px**.
- Do not change claim/lead copy, SMTP, or providers.
- Do not build campaign/newsletter mails in this PRD.
- Keep `EmailTemplateModel` / `RenderedEmail` / `renderEmailTemplate` / `renderNotificationEmail` public APIs stable.

## File map

| File | Responsibility |
| --- | --- |
| `mail-design/theme.ts` | Color, spacing, radius, shadow, font, layout width tokens |
| `mail-design/escape.ts` | `escapeHtml` / `escapeAttribute` |
| `mail-design/components/*.ts` | One component (or small group) per file returning HTML strings |
| `mail-design/layout.ts` | Full document shell: preview + header + body card slot + footer |
| `mail-design/render.ts` | `renderMailDocument(input)` → `{ html, text }` |
| `mail-design/index.ts` | Public exports for EMDS |
| `mail-design/mail-design.test.ts` | Token/layout/component/render tests |
| `notifications/email-templates.ts` | Thin adapter: model → EMDS render (API unchanged) |
| `notifications/notifications.test.ts` | Update assertions for brand red / Arial (not teal/Georgia) |
| `application/src/index.ts` | Re-export EMDS theme/components if useful (optional, prefer mail-design index) |

---

### Task 1: Theme tokens + escape helpers

**Files:**
- Create: `packages/application/src/mail-design/theme.ts`
- Create: `packages/application/src/mail-design/escape.ts`
- Create: `packages/application/src/mail-design/mail-design.test.ts`
- Create: `packages/application/src/mail-design/index.ts`

**Interfaces:**
- Produces:
  - `MailTheme` object + `mailTheme` constant
  - `escapeHtml(value: string): string`
  - `escapeAttribute(value: string): string`

- [ ] **Step 1: Write failing tests for theme + escape**

```ts
import { describe, expect, it } from "vitest";
import { escapeAttribute, escapeHtml } from "./escape";
import { mailTheme } from "./theme";

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
```

- [ ] **Step 2: Run test — expect FAIL (modules missing)**

Run: `npx vitest run packages/application/src/mail-design/mail-design.test.ts`

- [ ] **Step 3: Implement theme + escape**

`theme.ts` must include at least:
- `color`: brandRed, brandNavy, white, lightGray, borderGray, accentBlue, successBg, successText, warningBg, warningText, infoBg, infoText, text, textMuted, textInverse
- `space`: 4, 8, 12, 16, 24, 28, 32
- `radius`: sm, md, lg
- `shadow.card`
- `font.family`, `font.size` (sm/md/lg/xl)
- `layout.maxWidthPx: 600`
- `cta.minHeightPx: 44`

`escape.ts`: same escaping rules as current `email-templates.ts`.

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add packages/application/src/mail-design
git commit -m "Add EMDS theme tokens and HTML escape helpers."
```

---

### Task 2: Core components (Header, Logo, Title, Card, CTA, Boxes, Divider)

**Files:**
- Create: `packages/application/src/mail-design/components/header.ts`
- Create: `packages/application/src/mail-design/components/logo.ts`
- Create: `packages/application/src/mail-design/components/badge.ts`
- Create: `packages/application/src/mail-design/components/title.ts`
- Create: `packages/application/src/mail-design/components/subtitle.ts`
- Create: `packages/application/src/mail-design/components/card.ts`
- Create: `packages/application/src/mail-design/components/section.ts`
- Create: `packages/application/src/mail-design/components/divider.ts`
- Create: `packages/application/src/mail-design/components/info-box.ts`
- Create: `packages/application/src/mail-design/components/success-box.ts`
- Create: `packages/application/src/mail-design/components/warning-box.ts`
- Create: `packages/application/src/mail-design/components/primary-cta.ts`
- Create: `packages/application/src/mail-design/components/secondary-cta.ts`
- Create: `packages/application/src/mail-design/components/index.ts`
- Modify: `packages/application/src/mail-design/mail-design.test.ts`
- Modify: `packages/application/src/mail-design/index.ts`

**Interfaces:**
- Consumes: `mailTheme`, `escapeHtml`, `escapeAttribute`
- Produces HTML fragment functions, e.g.:
  - `renderMailLogo(): string`
  - `renderMailBadge(label: string): string`
  - `renderMailTitle(text: string): string`
  - `renderMailSubtitle(text: string): string`
  - `renderMailCard(innerHtml: string): string`
  - `renderMailSection(innerHtml: string): string`
  - `renderMailDivider(): string`
  - `renderMailInfoBox(text: string): string` (same for success/warning)
  - `renderMailPrimaryCta(label: string, href: string): string`
  - `renderMailSecondaryCta(label: string, href: string): string`
  - `renderMailHeader(options?: { badge?: string }): string`

- [ ] **Step 1: Write failing component smoke tests**

```ts
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
```

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement components with inline styles from tokens only**

Primary CTA: brand red bg, white text, border-radius from tokens, `display:inline-block`, padding such that height ≥ 44px.  
Secondary CTA: white bg, brand red/navy border outline.  
Boxes: left border or soft fill from semantic tokens.  
No hardcoded hex outside `mailTheme`.

- [ ] **Step 4: Run — PASS**

- [ ] **Step 5: Commit**

```bash
git commit -m "Add EMDS mail UI components."
```

---

### Task 3: Footer components + layout + renderMailDocument

**Files:**
- Create: `packages/application/src/mail-design/components/footer.ts`
- Create: `packages/application/src/mail-design/components/social-links.ts`
- Create: `packages/application/src/mail-design/components/legal-footer.ts`
- Create: `packages/application/src/mail-design/layout.ts`
- Create: `packages/application/src/mail-design/render.ts`
- Modify: `packages/application/src/mail-design/components/index.ts`
- Modify: `packages/application/src/mail-design/index.ts`
- Modify: `packages/application/src/mail-design/mail-design.test.ts`

**Interfaces:**
- Produces:
```ts
export type MailDocumentInput = Readonly<{
  readonly subject: string;
  readonly preview: string;
  readonly bodyHtml: string;
  readonly text: string;
  readonly badge?: string;
  readonly footer?: Readonly<{
    readonly contactEmail?: string;
    readonly websiteUrl?: string;
    readonly address?: string;
    readonly copyright?: string;
    readonly unsubscribeUrl?: string;
  }>;
}>;

export function renderMailDocument(input: MailDocumentInput): {
  html: string;
  text: string;
};
```

- Layout: DOCTYPE html, viewport meta, hidden preview div, full-width outer table, inner table `max-width:600px`, header, card-wrapped bodyHtml, footer/legal.
- Default footer values: website `https://eduatlas.com.tr`, contact `info@eduatlas.com`, copyright year dynamic or fixed string “EduAtlas”.

- [ ] **Step 1: Failing test — document contains 600px, Arial, brand header, no Georgia/teal**

```ts
it("renderMailDocument builds 600px shell", () => {
  const { html } = renderMailDocument({
    subject: "S",
    preview: "P",
    bodyHtml: "<p>Body</p>",
    text: "Body",
  });
  expect(html).toContain("max-width:600px");
  expect(html).toContain(mailTheme.color.brandRed);
  expect(html).not.toContain("Georgia");
  expect(html).not.toContain("#0f766e");
});
```

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement layout + render**

- [ ] **Step 4: Run — PASS**

- [ ] **Step 5: Commit**

```bash
git commit -m "Add EMDS layout and document renderer."
```

---

### Task 4: Migrate `renderEmailTemplate` to EMDS

**Files:**
- Modify: `packages/application/src/notifications/email-templates.ts`
- Modify: `packages/application/src/notifications/notifications.test.ts`
- Modify: `packages/application/src/index.ts` (export mail-design public API if desired)
- Modify: `packages/application/src/notifications/index.ts` (optional re-export)

**Interfaces:**
- Consumes: `renderMailDocument`, `renderMailTitle`, `renderMailPrimaryCta`, `escapeHtml`
- Keeps:
```ts
export function renderEmailTemplate(model: EmailTemplateModel): RenderedEmail
export function renderNotificationEmail(...): RenderedEmail
```

- [ ] **Step 1: Update email template tests**

```ts
it("renders EMDS HTML and plain-text fallback", () => {
  const rendered = renderEmailTemplate({
    title: "Test subject",
    preview: "Preview text",
    bodyLines: ["Line one", "Line two"],
    ctaLabel: "Open",
    ctaHref: "https://example.com",
  });
  expect(rendered.subject).toBe("Test subject");
  expect(rendered.text).toContain("Line one");
  expect(rendered.html).toContain("max-width:600px");
  expect(rendered.html).toContain("#e62846");
  expect(rendered.html).not.toContain("#0f766e");
  expect(rendered.html).not.toContain("Georgia");
});
```

- [ ] **Step 2: Run — FAIL if still on legacy template**

- [ ] **Step 3: Rewrite `renderEmailTemplate` body to compose EMDS**

Map `bodyLines` → escaped `<p>` paragraphs using theme spacing.  
Optional CTA → `renderMailPrimaryCta`.  
Pass into `renderMailDocument`.  
Move escape helpers to import from `mail-design/escape` (delete local duplicates).

- [ ] **Step 4: Run full notification tests**

Run: `npx vitest run packages/application/src/notifications packages/application/src/mail-design`  
Expected: PASS

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck --workspace=@eduatlas/application`  
Expected: exit 0

- [ ] **Step 6: Commit**

```bash
git commit -m "Route transactional emails through EMDS layout."
```

---

### Task 5: Spec acceptance checklist + docs touch

**Files:**
- Modify: `docs/superpowers/specs/2026-08-02-eduatlas-mail-design-system-design.md` (check acceptance boxes)

- [ ] **Step 1: Verify acceptance criteria in spec against implementation**
- [ ] **Step 2: Commit**

```bash
git commit -m "Mark EMDS design acceptance criteria complete."
```

---

## Spec coverage self-review

| Spec requirement | Task |
| --- | --- |
| Theme tokens | Task 1 |
| Components listed in PRD | Task 2–3 |
| 600px layout, no images/fonts/CSS | Task 3 |
| Outlook table layout | Task 3 |
| Migrate existing renderer | Task 4 |
| No campaign mails / SMTP untouched | All (out of scope) |
| Future mails share layout | Task 3 `renderMailDocument` |

## Placeholder scan

None intentional — all signatures and test snippets concrete.
