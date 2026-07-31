# EduAtlas — Design System

| Field | Value |
| --- | --- |
| **Product** | EduAtlas |
| **Document** | DESIGN-SYSTEM.md |
| **Version** | 1.0 |
| **Sprint** | Sprint-001 — Foundation |
| **Task** | Task-014 |
| **Status** | Binding design language specification |
| **Last updated** | 14 July 2026 |

---

## Document control

This document defines the **complete design language** of EduAtlas — Türkiye’s education ecosystem platform. It is the source of truth for visual tokens, component semantics, motion, forms, and accessibility.

| Related document | Role |
| --- | --- |
| `BRAND-GUIDELINES.md` | Brand personality, logo, voice, photo/illustration/motion |
| `VISUAL-DIRECTION.md` | Design philosophy, surface philosophies, hierarchy & elevation |
| `UI-ARCHITECTURE.md` | Screens & shells |
| `NAVIGATION.md` | Header/footer/CTA patterns |
| `INSTITUTION-PROFILE-SPECIFICATION.md` | Profile composition |
| `SYSTEM-ARCHITECTURE.md` | `packages/ui` ownership |

**Non-goals:** CSS/React implementation, asset binaries, or final marketing copy.

**Feel targets:** Professional · Trustworthy · Modern · Accessible · Simple.

---

## 1. Purpose

Create a **scalable design system** that works across:

- Public SEO / discovery website  
- Institution Owner portal  
- Admin console  

One language, three densities (marketing, product, console)—same tokens, different layout rhythm.

---

## 2. Design principles

| Principle | Meaning |
| --- | --- |
| **Clarity** | One primary action per region; readable hierarchy; no decorative noise |
| **Consistency** | Same components mean the same thing on public, owner, and admin surfaces |
| **Accessibility** | WCAG 2.2 AA is a release gate, not a polish phase |
| **Performance** | Light motion, optimized images, no effect-driven jank |
| **Content first** | Typography and information outrank ornament; chrome supports content |

### 2.1 Composition rules (product UX)

1. **Brand-visible on public marketing surfaces** — logo/wordmark is a clear header signal; home hero does not bury the brand.  
2. **Cards are not the default layout primitive** — use cards only when the container wraps a clear interaction (result selection, lead form grouping, settings panel). Prefer open layout with spacing and typography.  
3. **No hero sticker clutter** — no floating promo badges on full-bleed imagery.  
4. **Restrained chrome** — avoid pill clusters, glow, multi-layer shadow stacks, and emoji as UI.  
5. **Light mode first** — dark mode is future (see §14); do not design MVP assuming dark UI.

---

## 3. Visual language

### 3.1 Inspiration

| Reference | What we borrow | What we do not copy |
| --- | --- | --- |
| **Google** | Clarity of search/results, scannable facts, strong empty states, accessible defaults | Material purple accents, dense icon ornament, generic “Google blue only” identity |
| **Stripe** | Trust via typography + whitespace, precise forms, calm enterprise credibility | Fintech-only dark gradients, excessive glassmorphism |
| **Airbnb** | Warm human photography, discovery browsing rhythm, mobile sticky CTAs done cleanly | Playful over-illustration, marketplace card grids as the only metaphor |

**Why this mix fits EduAtlas**

Parents decide under stress (school choice). The UI must feel like a **credible infrastructure product** (Stripe/Google) while remaining **human and local** (Airbnb’s discovery empathy)—not a loud consumer gimmick, not a cold government portal.

### 3.2 Brand personality

| Attribute | Expression |
| --- | --- |
| Trustworthy | Steady ink/teal primary, clear NAP, verification badges with sober styling |
| Modern | Clean sans hierarchy, 4px spacing, sharp but friendly radii |
| Simple | Few accent colors in one view; progressive disclosure |
| Turkish market | Natural photography of real campuses/children contexts (with rights); TR copy length respected in components |

### 3.3 Anti-patterns (explicit)

- Purple-on-white / purple–indigo gradient “AI SaaS” look  
- Warm cream canvas + terracotta + display serif cliché  
- Broadsheet / newspaper dense column aesthetic  
- Neon glow, glass blur stacks, ultra-pill (“rounded-full”) chip spam  
- Default system UI fonts as brand voice  

---

## 4. Color system

Colors are specified as **semantic tokens**. Hex values are the MVP reference palette; themes map tokens, not raw hex in features.

### 4.1 Primary

Used for key actions, links, and brand emphasis.

| Token | Reference | Usage |
| --- | --- | --- |
| `color.primary.600` | `#0F6B6B` | Primary buttons, key links |
| `color.primary.700` | `#0B5353` | Hover / active |
| `color.primary.50` | `#E6F5F5` | Selected rows, soft highlights |
| `color.primary.100` | `#C5E8E8` | Chip backgrounds (quiet) |

Teal-ink reads as education + calm trust without purple.

### 4.2 Secondary

Used sparingly for secondary emphasis (charts, alternate CTAs).

| Token | Reference | Usage |
| --- | --- | --- |
| `color.secondary.600` | `#1F4B7A` | Secondary buttons, informational emphasis |
| `color.secondary.50` | `#E8EEF5` | Soft secondary surfaces |

### 4.3 Neutral

| Token | Reference | Usage |
| --- | --- | --- |
| `color.neutral.0` | `#FFFFFF` | Surfaces |
| `color.neutral.25` | `#F7F8FA` | Page background (cool, not cream) |
| `color.neutral.50` | `#F0F2F5` | Subtle panels |
| `color.neutral.100` | `#E2E6EB` | Borders (subtle) |
| `color.neutral.300` | `#B0B8C2` | Disabled borders |
| `color.neutral.500` | `#6B7280` | Secondary text |
| `color.neutral.700` | `#374151` | Body text |
| `color.neutral.900` | `#111827` | Headings / ink |

### 4.4 Success / Warning / Error / Information

| Token | Reference | Usage |
| --- | --- | --- |
| `color.success.600` | `#1B7A4E` | Success text/icons |
| `color.success.50` | `#E8F7EF` | Success banners |
| `color.warning.600` | `#B86E00` | Warning text |
| `color.warning.50` | `#FFF6E5` | Warning banners |
| `color.error.600` | `#C43131` | Errors, destructive |
| `color.error.50` | `#FDECEC` | Error banners / field errors |
| `color.info.600` | `#1F4B7A` | Info (aligns secondary) |
| `color.info.50` | `#E8EEF5` | Info banners |

### 4.5 Semantic mapping

| Role | Token |
| --- | --- |
| Page background | `neutral.25` |
| Surface | `neutral.0` |
| Border default | `neutral.100` |
| Text primary | `neutral.700` |
| Text muted | `neutral.500` |
| Text inverse | `neutral.0` on `primary.700` / `neutral.900` |
| Focus ring | `primary.600` @ accessible contrast |
| Link | `primary.700` |

### 4.6 Atmosphere (public marketing)

Do not rely on a flat void. Allowed:

- Soft neutral wash (`neutral.25` → `neutral.0`)  
- Light geometric pattern at ≤ 3% opacity  
- Full-bleed photography on home hero only (per marketing rules)  

Admin/Owner: flat calm neutrals; no marketing gradients.

---

## 5. Typography

### 5.1 Font families

| Role | Family (spec) | Fallback stack (after brand fonts load) |
| --- | --- | --- |
| **UI / Body** | **Plus Jakarta Sans** | `"Plus Jakarta Sans", "Segoe UI", sans-serif` |
| **Display (marketing)** | **Fraunces** (optical soft) **or** Plus Jakarta Sans ExtraBold if single-font constraint | Serif only for rare marketing display — never for admin tables |

**Do not use** Inter, Roboto, Arial, or system-ui as the brand identity face.

License fonts for production self-host or approved CDN; subset Latin + Turkish glyphs (`ğüşıöç ĞÜŞİÖÇ`).

### 5.2 Type roles

| Role | Size / line / weight (desktop ref) | Usage |
| --- | --- | --- |
| **Display** | 40–48 / 1.15 / 700 | Home hero headline only |
| **Heading H1** | 32 / 1.2 / 700 | Page titles (institution name, hub H1) |
| **Heading H2** | 24 / 1.25 / 650 | Section titles |
| **Heading H3** | 20 / 1.3 / 650 | Subsections |
| **Body** | 16 / 1.55 / 400 | Default reading |
| **Body emphasis** | 16 / 1.55 / 600 | Labels in content |
| **Small** | 14 / 1.45 / 400 | Meta, table secondary |
| **Caption** | 12–13 / 1.4 / 500 | Badges, timestamps, legal notes |

### 5.3 Mobile type

Reduce Display to ~32 and H1 to ~28; body stays ≥ 16 for forms and readability.

### 5.4 Rules

- One H1 per page.  
- Line length for reading blocks ≈ 60–75 characters.  
- Avoid all-caps for long Turkish strings.  
- Tabular numbers in admin tables (`font-variant-numeric: tabular-nums`).

---

## 6. Spacing

### 6.1 4px grid

Base unit: **4px**. All spacing tokens are multiples of 4.

| Token | Value |
| --- | --- |
| `space.0` | 0 |
| `space.1` | 4px |
| `space.2` | 8px |
| `space.3` | 12px |
| `space.4` | 16px |
| `space.5` | 20px |
| `space.6` | 24px |
| `space.8` | 32px |
| `space.10` | 40px |
| `space.12` | 48px |
| `space.16` | 64px |
| `space.20` | 80px |
| `space.24` | 96px |

### 6.2 Margins & padding guidance

| Context | Padding | Notes |
| --- | --- | --- |
| Page gutter (mobile) | `space.4` | 16px |
| Page gutter (desktop) | `space.6`–`space.8` | Align with container |
| Section vertical gap | `space.12`–`space.16` | Public |
| Card/panel padding | `space.4`–`space.6` | When card used |
| Form field stack | `space.4` | Between fields |
| Compact admin cell | `space.2`–`space.3` | Density |

---

## 7. Layout

### 7.1 Containers

| Token | Max width | Usage |
| --- | --- | --- |
| `container.sm` | 640px | Narrow forms (auth) |
| `container.md` | 768px | Article reading |
| `container.lg` | 1024px | Default public content |
| `container.xl` | 1200px | Hubs + results |
| `container.2xl` | 1440px | Admin wide tables |

Center containers; gutters outside.

### 7.2 Grid

- Public results: 1 col mobile → 2 tablet → 3 desktop.  
- Profile: single column main + optional aside on large desktop (contact stack).  
- Admin: fluid full width inside console shell.  
- CSS grid/flex both allowed; prefer consistent gap tokens (`space.4`/`space.6`).

### 7.3 Breakpoints

| Name | Min width | Usage |
| --- | --- | --- |
| `xs` | 0 | Mobile |
| `sm` | 480px | Large phones |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Wide |
| `2xl` | 1536px | Ultra-wide admin |

### 7.4 Radius & border

| Token | Value | Usage |
| --- | --- | --- |
| `radius.sm` | 6px | Inputs, small controls |
| `radius.md` | 10px | Buttons, panels |
| `radius.lg` | 14px | Dialogs, large media |
| `radius.full` | 9999px | **Avoid** for chips/buttons; allowed only for avatars/status dots |

Borders: 1px `neutral.100`; focus not via thick decorative borders alone.

### 7.5 Elevation

Prefer **border + spacing** over shadow. If elevation needed:

| Token | Usage |
| --- | --- | --- |
| `shadow.sm` | Single soft shadow for dialogs/dropdowns only |
| `shadow.none` | Default surfaces |

No multi-layer glow stacks.

---

## 8. Component tokens

Semantics — not implementation.

### 8.1 Buttons

| Variant | Use |
| --- | --- |
| **Primary** | One main action (Bilgi Al, Save, Approve) |
| **Secondary** | Alternative (WhatsApp, Cancel) |
| **Tertiary / Ghost** | Low emphasis (Edit details) |
| **Destructive** | Delete, reject, spam |
| **Link button** | Inline textual action |

| Size | Min height | Padding x |
| --- | --- | --- |
| `sm` | 32px | 12px |
| `md` | 40px | 16px |
| `lg` | 48px | 20px |

Rules: label case sentence-style Turkish; icon+label OK; icon-only needs aria-name; disabled = reduced opacity + `not-allowed` + no click.

### 8.2 Inputs

- Height `md` 40px; label above field (not only placeholder).  
- Border `neutral.100`; hover slightly darker; focus ring `primary`.  
- Placeholder `neutral.500`; never as only label.  
- Textarea min 3 lines for lead message.  
- Select / combobox same height as input.

### 8.3 Cards

**Allowed when** the block is an interactive unit: institution result, lead list item, settings group.

| Token | Spec |
| --- | --- |
| Background | `neutral.0` |
| Border | 1px `neutral.100` |
| Radius | `radius.md` |
| Padding | `space.4`–`space.6` |
| Hover (interactive) | Border → `primary.100` or slight background `neutral.25` — not big shadow lift |

**Disallowed:** wrapping every page section in cards; carding the marketing hero.

### 8.4 Badges

| Badge | Style |
| --- | --- |
| Claimed | Quiet primary soft bg + primary text |
| Verified | Success soft |
| Premium / Featured | Secondary soft + explicit text (“Öne çıkan” / “Premium”) |
| Status (lead) | Neutral / info / warning / success mapping |

Small caption type; **not** oversized pills.

### 8.5 Tags / chips

Filter chips: `radius.md` (not full pill), selectable state uses `primary.50` + `primary.700` text. Multi-select clear affordance.

### 8.6 Tables (admin / owner)

- Header: `neutral.50` bg, small caps avoided, `small` semibold.  
- Row hover: `neutral.25`.  
- Compact density default in admin.  
- Horizontal scroll on mobile rather than crushing columns unreadably.

### 8.7 Dialogs

- Max width `container.sm`–`md`.  
- Overlay scrim ~40–50% neutral.900.  
- Title H2; focus trap; Esc closes; primary action right (LTR).  
- Use for confirmations & optional lead modal — not for every form.

### 8.8 Dropdowns / menus

- `shadow.sm` + border.  
- Item height ≥ 36px.  
- Keyboard: arrows, typeahead optional, Esc.  
- Mega-menus (Types/Cities): structured lists, not image-heavy ad walls.

### 8.9 Toasts / notifications

- Bottom/top edge consistent sitewide.  
- Success/error colors from semantic tokens.  
- Auto-dismiss non-critical; errors persist longer.

---

## 9. Icons

| Rule | Spec |
| --- | --- |
| **Style** | Outlined, 1.5–2px stroke, rounded joins; single family (e.g. Lucide-like geometric) |
| **Sizing** | 16 / 20 / 24px; align to text |
| **Usage** | Support labels; don’t replace critical text CTAs |
| **Color** | Inherit text color; semantic when status |
| **Filled** | Rare (active nav, selected favorite) |

No skeuomorphic icons; no emoji icons in product chrome.

---

## 10. Motion

Ship intentional, quiet motion — presence, not noise.

| Pattern | Duration | Easing | Use |
| --- | --- | --- | --- |
| **Fade / soft move** | 150–200ms | ease-out | Menus, toasts |
| **Hover** | 120ms | ease | Buttons, cards (color/border) |
| **Loading** | Loop | linear | Spinners / skeleton shimmer subtle |
| **Page transition** | Avoid heavy | — | Prefer instant + skeleton |

Rules:

- Respect `prefers-reduced-motion: reduce` → snap, no shimmer.  
- No parallax on hubs.  
- Sticky CTA appears without large layout jump (reserve space).  
- Minimum **2–3 intentional motions** on marketing home (e.g. search focus, subtle hero fade, CTA hover)—keep portals calmer.

---

## 11. Forms

### 11.1 Anatomy

Label → Input → Helper text → Error text.

### 11.2 Validation

| Timing | Rule |
| --- | --- |
| Blur / submit | Show errors; don’t scream on first keystroke |
| Required | Mark in label (“Zorunlu” or *) consistently |
| Phone / email | Format helpers in caption |

### 11.3 Errors

- Field border `error.600`; message `error.600` caption below.  
- Summary alert at top of form for submit failures.  
- Associate via accessible IDs.

### 11.4 Success

- Inline success for settings saves (toast + brief field check).  
- Lead success: dedicated confirmation state, calm success color, next optional actions (back to profile).

### 11.5 Consent

Lead consent checkbox: clear legal-adjacent language; error if unchecked on submit.

---

## 12. Empty & system states

| State | Visual | Content |
| --- | --- | --- |
| **Loading** | Skeleton matching layout (not generic spinner-only on pages) | Preserve structure for CLS |
| **No results** | Simple illustration optional (line art, monochrome) + message + clear filters CTA | Helpful, not playful cartoon spam |
| **No favorites / no leads** | Same pattern; one primary action | See `UI-ARCHITECTURE` |
| **Offline** | Banner or full page; retry button | Neutral warning tone |
| **Error 404/500** | Clear title, short explanation, search/home links | No stack traces |

Illustrations: geometric/line, teal-ink palette, no emoji mascots.

---

## 13. Branding

### 13.1 Logo usage

| Rule | Spec |
| --- | --- |
| Clear space | ≥ wordmark height × 0.5 around logo |
| Min size | Header ~24–28px height wordmark |
| On light | Primary ink/teal mark |
| On photography | Solid/plate behind logo if contrast fails |
| Do not | Stretch, recolor to arbitrary gradients, add glow, place on busy clutter |

Lockup: symbol + “EduAtlas” wordmark; symbol-only only when space-constrained and recognizable.

### 13.2 Illustrations

- Optional empty states & about page.  
- Flat vector, limited palette (primary + neutrals).  
- Avoid clipart children stereotypes; prefer abstract education/map metaphors if used.

### 13.3 Photography

| Use | Guidance |
| --- | --- |
| Home hero | Full-bleed, real educational context; rights-cleared |
| Institution gallery | Real campus; no scraped watermarks |
| Hubs | Prefer typography + light atmosphere over stock collage grids |
| Treatment | Natural color; slight contrast OK; no heavy HDR/neon |

---

## 14. Dark mode (future)

| Topic | Strategy |
| --- | --- |
| MVP | **Light only** |
| Future | Token-based inversion: neutrals flip; primary teal adjusted for contrast on dark surfaces |
| Do not | Ship incomplete partial dark; do not make dark the brand default |
| Admin | May adopt dark later for long sessions — separate evaluation |
| Media | Photos unchanged; overlays increase for logo contrast |

When implemented: `color-scheme` + semantic tokens only; no per-page one-off hex.

---

## 15. Accessibility

| Area | Requirement |
| --- | --- |
| **Standard** | WCAG 2.2 Level **AA** |
| **Contrast** | Text/icon on surfaces ≥ 4.5:1 (3:1 large/UI); verify primary buttons |
| **Focus** | Visible focus ring ≥ 2px; never `outline: none` without replacement |
| **Keyboard** | All actions reachable; dialogs trap focus; menus operable |
| **Touch** | Targets ≥ 44×44px on mobile |
| **Screen readers** | Labels, landmarks, live regions for toasts/errors |
| **Color** | Status never color-only — include text/icon |
| **Zoom** | Usable at 200% zoom |

Contrast checks required when adjusting teal/red tokens.

---

## 16. Surface themes

| Surface | Density | Background | Notes |
| --- | --- | --- | --- |
| **Public** | Comfortable | `neutral.25` page / white sections | Marketing home may use photo hero |
| **Owner portal** | Medium | `neutral.25` + white panels | Same components, less display type |
| **Admin** | Compact | `neutral.25` + white tables | Smaller paddings; same tokens |

Do not invent a second unrelated palette per app.

---

## 17. Content & localization (design impact)

- Components must tolerate **longer Turkish strings** (buttons wrap or grow; no fixed English-only widths).  
- Date/number formatting TR.  
- Breakpoints tested with real TR labels (“Kurumunu Sahiplen”, “Bilgi Al”).

---

## 18. Performance (design constraints)

| Constraint | Spec |
| --- | --- |
| Fonts | Max 2 families; subset; `font-display: swap` |
| Images | Responsive sizes; lazy below fold |
| Icons | Tree-shakeable set; avoid huge icon fonts if costly |
| Motion | Short; GPU-friendly opacity/transform only |
| CSS | Token-driven; avoid huge one-off overrides |

---

## 19. Governance

| Topic | Rule |
| --- | --- |
| New component | Must map to tokens; documented variant matrix |
| One-off colors | Forbidden in features without token PR |
| Exceptions | Marketing campaigns time-boxed; cannot break a11y |
| Package | Implemented later in `packages/ui` per system architecture |

---

## 20. Quick token index

| Category | Keys |
| --- | --- |
| Color | primary, secondary, neutral, success, warning, error, info |
| Type | display, h1–h3, body, small, caption |
| Space | 0–24 (4px grid) |
| Layout | container.sm–2xl, breakpoints xs–2xl |
| Radius | sm, md, lg (full rare) |
| Shadow | none, sm |
| Motion | 120–200ms ease-out defaults |

---

## 21. Approval

| Role | Name | Date | Sign-off |
| --- | --- | --- | --- |
| Design | | | ☐ |
| Product | | | ☐ |
| Engineering | | | ☐ |
| Accessibility | | | ☐ |

**Summary:** EduAtlas’s design system is a **light, teal-ink, content-first** language inspired by the clarity of Google, the trust of Stripe, and the discovery empathy of Airbnb—built on a **4px grid**, **Plus Jakarta Sans**, semantic color tokens, restrained elevation, accessible forms, and scalable components for public, owner, and admin surfaces—without purple gradients, cream-terracotta clichés, or dark-mode-first styling.
