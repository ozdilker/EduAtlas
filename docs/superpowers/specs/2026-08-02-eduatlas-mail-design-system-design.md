# PRD-MAIL-001 — EduAtlas Mail Design System (EMDS)

| Field | Value |
| --- | --- |
| **Date** | 2026-08-02 |
| **Status** | Approved (conversation) |
| **Package** | `packages/application/src/mail-design/` |

## Goal

Single reusable HTML email design system so every EduAtlas transactional mail shares the same brand language as the public site. **No campaign / newsletter content** in this PRD.

## Non-goals

- Campaign, newsletter, premium promo, invoice content
- SMTP / provider changes
- Claim / lead business logic or copy changes
- External CSS, external fonts, stock images, hero banners, Lottie, icon libraries

## Placement

**Option A (approved):** live under `packages/application/src/mail-design/`.

Existing `renderEmailTemplate` / `renderNotificationEmail` keep their public API and route HTML through EMDS layout (visual upgrade only).

## Architecture

```
Email Theme (tokens)
  → Layout (600px shell)
    → Components (header, card, CTA, boxes, footer, …)
      → Content (caller-supplied strings)
        → Render ({ html, text })
```

Every mail uses the **same layout**. Future claim / lead / welcome / reset / verification mails compose components; they do not invent new chrome.

## Theme tokens

TypeScript constants (no CSS variables in the wire format — email clients need **inline styles** resolved from tokens).

| Token group | Source / values |
| --- | --- |
| Brand red | `#e62846` (web `--ea-color-brand-600`) |
| Brand navy | `#0f172a` |
| White | `#ffffff` |
| Light gray | `#f2f2f0` / surface wash |
| Border gray | `#e8e8e4` |
| Accent blue | `#2563eb` (info) |
| Success / warning | aligned with web semantic tokens |
| Spacing | 4 / 8 / 12 / 16 / 24 / 28 / 32 |
| Radius | sm / md / lg |
| Shadow | soft card shadow (inline-safe) |
| Font | `Arial, Helvetica, sans-serif` |
| CTA min-height | ≥ 44px |

No magic values in components — only token references.

## Layout

- Outer full-width table, light wash / subtle CSS pattern (no images)
- Centered container **max-width 600px**
- **Header:** white, minimal — EduAtlas wordmark (text) + optional badge
- **Body:** primary content inside a **Card**
- **Footer:** contact, website, copyright, address, unsubscribe slot
- Table-based (`role="presentation"`), Outlook / Gmail / Apple Mail / Yahoo aware
- Responsive targets: 320 / 375 / 390 / 768 (fluid width inside 600px max)
- Dark mode: readable without broken inverted colors (prefer explicit ink/bg; avoid pure black-on-black)

## Components (API surface)

Pure functions returning HTML string fragments (inline styles):

Header, Logo, Badge, Title, Subtitle, Card, Section, Divider, InfoBox, SuccessBox, WarningBox, PrimaryCta, SecondaryCta, Footer, SocialLinks, LegalFooter

Icons: Unicode or tiny inline SVG only.

No animation.

## CTA

- Primary: brand red fill, white text
- Secondary: white fill, brand red / navy outline

## Migration of existing mail

- `renderEmailTemplate(model)` builds EMDS layout with Title + body lines + optional Primary CTA + LegalFooter
- Subjects, body lines, CTA labels/hrefs **unchanged**
- Teal / Georgia legacy styles removed
- Claim invite path continues to call the same renderer; SMTP untouched

## Acceptance

- [x] Design approved in conversation
- [x] Single mail theme module
- [x] No images / no external CSS / no external fonts
- [x] 600px container + tokens + component set
- [x] Existing transactional HTML uses EMDS
- [x] Outlook-oriented table markup
- [x] Tests + typecheck; existing notification tests still pass

## Out of scope follow-ups

Per-mail content PRDs (claim, lead, campaign, newsletter, etc.) consume EMDS later.
