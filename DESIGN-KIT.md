# EduAtlas — Design Kit v1.0

| Field | Value |
| --- | --- |
| **Product** | EduAtlas |
| **Document** | DESIGN-KIT.md |
| **Version** | 1.0 |
| **Sprint** | Design Kit v1.0 |
| **Status** | Binding asset governance source of truth |
| **Market** | Türkiye |
| **Locale (MVP)** | Turkish (`tr-TR`) |
| **Last updated** | 16 July 2026 |

---

## Document control

This document defines the **permanent EduAtlas Design Kit**: folder structure, naming, export rules, versioning, and ownership.

It is the governance companion to:

| Document | Role |
| --- | --- |
| `VISUAL-REFERENCE.md` | Official visual specification (what assets must look like) |
| `BRAND-GUIDELINES.md` | Brand meaning, logo ethics, voice |
| `VISUAL-DIRECTION.md` | Design philosophy & surface philosophies |
| `DESIGN-SYSTEM.md` | Tokens & component semantics |
| `PRD.md` | Product mission & MVP scope (product north star) |

**Non-goals:** React components, CSS implementation, routes, Firebase, or application logic.

### Critical rule

Approved assets in `/design-kit` are **implementation assets**.

- Cursor (and any implementer) may **only implement** approved assets.
- Cursor must **never invent**, redesign, or “improve” kit assets during UI work.
- If an asset is missing, create a kit ticket — do not freestyle a substitute UI look.

### Conflict rule

| Conflict | Winner |
| --- | --- |
| App UI vs approved kit asset | **Update the UI** to match the kit |
| Kit binary vs `VISUAL-REFERENCE.md` | Fix the binary; docs define intent |
| Kit color vs live CSS tokens | Update tokens in a dedicated sync sprint — kit remains the visual authority for brand red/teal/navy |

---

## 1. Purpose

Establish one permanent visual source of truth so EduAtlas never drifts into invented UI.

The Design Kit supplies:

1. Brand marks and lockups  
2. Hero / city / photography direction  
3. Illustration, icon, and badge libraries  
4. Card, owner, admin, and UI chrome references  
5. Motion, typography, and color boards  
6. Naming, export, and version discipline  

---

## 2. Folder structure

```text
/design-kit
  /branding          Logo lockups, favicons, app icons, monochrome
  /hero              Homepage & dynamic hero photography + overlays
  /city-assets       81 city specifications + hero plates
  /illustrations     Empty states, atlas metaphors, status art
  /cards             Institution / city / category / recommendation cards
  /owner             Owner portal chrome, widgets, chart treatments
  /admin             Admin health, AI panels, ops chrome
  /badges            Verification, premium, featured, status badges
  /icons             Product icon set (SVG)
  /ui                Buttons, forms, chips, skeletons reference boards
  /motion            Motion specs, timing boards, reduced-motion notes
  /typography        Type specimens (Fraunces / Plus Jakarta Sans)
  /colors            Palette boards & contrast notes
  /photography       Global photography briefs & grading LUTs notes
```

Each folder contains:

| File | Purpose |
| --- | --- |
| `README.md` | Scope, allowed asset types, status |
| `SPEC.md` | Folder-level specification (when needed) |
| Asset binaries / sources | Only after approval (`approved/` optional subfolder) |
| `CHANGELOG.md` | Folder-local history (optional; kit-wide changelog preferred) |

Root documents:

| Path | Role |
| --- | --- |
| `DESIGN-KIT.md` | This file — governance |
| `VISUAL-REFERENCE.md` | Full visual specification |
| `design-kit/README.md` | Kit index & workflow |

---

## 3. Asset naming

### 3.1 Pattern

```text
ea-{domain}-{name}-{variant}-{size}.{ext}
```

| Segment | Rules |
| --- | --- |
| `ea` | Always EduAtlas prefix |
| `domain` | `logo` · `hero` · `city` · `illust` · `card` · `owner` · `admin` · `badge` · `icon` · `ui` · `photo` · `type` · `color` · `motion` |
| `name` | kebab-case, English technical id (`galata`, `pin-mark`, `lead-card`) |
| `variant` | `full` · `mark` · `mono` · `light` · `dark` · `season-spring` · etc. |
| `size` | `sm` · `md` · `lg` · `xl` · explicit px (`64` · `128` · `512`) when export-bound |
| `ext` | `svg` · `png` · `webp` · `jpg` (photography only when webp unavailable) |

### 3.2 Examples

```text
ea-logo-pin-full.svg
ea-logo-pin-mark-mono.svg
ea-logo-app-icon-512.png
ea-hero-home-istanbul-dusk-xl.webp
ea-city-ankara-anitkabir-hero-lg.webp
ea-badge-verified-md.svg
ea-icon-search-24.svg
ea-card-institution-horizontal-ref.png
```

### 3.3 City ids

Use official province slug (ASCII kebab), matching product hubs where they exist:

```text
istanbul · ankara · izmir · bursa · antalya · gaziantep · ...
```

Full list: `design-kit/city-assets/CITIES-INDEX.md`.

### 3.4 Forbidden names

- Spaces, camelCase, Turkish diacritics in **filenames**  
- `final`, `new`, `v2-final-FINAL`  
- Generic `image1.png`, `asset.svg`  
- Competitor or stock-site watermarks in filenames  

---

## 4. SVG rules

| Rule | Spec |
| --- | --- |
| Purpose | Logos, icons, badges, simple illustrations |
| ViewBox | Required; prefer integer coordinates |
| IDs | Unique per file; no colliding `gradient` ids across inlined sets |
| Color | Prefer `currentColor` for mono icons; brand SVGs may use locked hex |
| Stroke | Icons: **1.5–2px** at 24×24 viewBox; rounded joins |
| Effects | Soft logo depth allowed only on official mark; no glow stacks on UI icons |
| Text | Outlined paths preferred; no embedded bitmaps inside SVG icons |
| Accessibility | Decorative SVGs: `aria-hidden`; meaningful: title/desc or adjacent text |
| Minification | Ship production SVGs optimized; keep editable sources in `source/` if needed |
| Do not | Convert photography to SVG; do not redraw logo as emoji paths |

### 4.1 Logo SVG variants (required)

| Variant | Filename stem | Notes |
| --- | --- | --- |
| Full lockup | `ea-logo-pin-full` | Pin + wordmark Edu/Atlas |
| Mark | `ea-logo-pin-mark` | Pin only |
| Mono | `ea-logo-pin-mark-mono` | Single currentColor |
| Small | `ea-logo-pin-small` | Optimized for ≤20px height |
| App | `ea-logo-pin-app` | On brand tile (red / teal / navy) |
| Favicon | `ea-logo-favicon` | Simplified mark |

---

## 5. PNG rules

| Rule | Spec |
| --- | --- |
| Use when | App icons, favicon fallbacks, assets needing transparency without SVG |
| Color | sRGB |
| Transparency | Allowed |
| Compression | Prefer lossless for brand marks; avoid posterization |
| Do not | Use PNG for large hero photography (use WEBP) |
| Retina | Export @1x and @2x when raster is required for UI chrome |

### 5.1 App icon PNG sizes

| Size | Use |
| --- | --- |
| 16 · 32 · 48 | Favicon pack |
| 180 | Apple touch |
| 192 · 512 | PWA / store |

---

## 6. WEBP rules

| Rule | Spec |
| --- | --- |
| Primary use | Hero, city, institution, editorial photography |
| Quality | Marketing heroes: **75–82**; cards/thumbs: **70–78** |
| Alpha | Avoid unless needed; prefer opaque photos |
| Max dimension | See §8 export sizes |
| Fallback | JPEG only if a consumer cannot accept WEBP (rare for EduAtlas web) |
| Metadata | Strip GPS; keep color profile sRGB |
| Ethics | Rights-cleared only; no scraped watermarks |

---

## 7. Responsive variants

Assets that appear in heroes and city hubs must ship with **breakpoint-aware crops**, not stretched desktop plates.

| Variant suffix | Target width | Typical use |
| --- | --- | --- |
| `sm` | ≤640 CSS px | Mobile hero / city |
| `md` | ≤1024 | Tablet |
| `lg` | ≤1440 | Desktop |
| `xl` | ≤1920 | Large desktop / 2× sources |

### 7.1 Crop philosophy

| Breakpoint | Composition |
| --- | --- |
| Desktop | Wide editorial; landmark readable; space for search overlay |
| Tablet | Slightly tighter; keep horizon / landmark |
| Mobile | Subject-centered crop; avoid tiny distant landmarks |

Do **not** invent a different illustration language on mobile — same photo family, different crop.

---

## 8. Export sizes

### 8.1 Photography

| Role | Long edge (px) | Aspect (guide) |
| --- | --- | --- |
| Home hero desktop | 2400–3200 | ~16:9 or 3:2 |
| Home hero mobile | 1200–1600 | ~4:5 or 9:16 crop |
| City hero | 2000–2800 | ~16:9 |
| City card thumb | 800–1200 | ~3:2 |
| Institution gallery | 1600–2400 | 4:3 or 3:2 |
| Recommendation thumb | 400–640 | 1:1 or 4:3 |

### 8.2 Brand / UI

| Role | Size |
| --- | --- |
| Logo SVG | Scalable (viewBox 64×80 mark canonical) |
| Icon SVG | 24×24 master; export also 16 / 20 |
| Badge SVG | 24 / 32 |
| Reference PNG boards | 1440-wide UI captures (documentation only) |

---

## 9. Versioning

### 9.1 Kit version

Semantic version on kit milestones:

| Version | Meaning |
| --- | --- |
| `1.0` | First permanent kit (this sprint) |
| `1.x` | Additive assets; no breaking brand change |
| `2.0` | Breaking brand/visual language change (rare; requires explicit approval) |

### 9.2 Asset version

Embed version in folder or filename when replacing:

```text
ea-logo-pin-full.svg          # current
/archive/2026-07/ea-logo-pin-full.svg
```

Never overwrite approved assets without:

1. Archiving the previous file  
2. Updating `design-kit/CHANGELOG.md`  
3. Noting breaking consumers (favicon cache, app icons)  

### 9.3 Approval states

| State | Meaning |
| --- | --- |
| `draft/` | Work in progress — **not** implementable |
| `review/` | Awaiting brand approval |
| `approved/` | Safe for implementation |
| `deprecated/` | Do not use in new work |

Until folders are populated with binaries, **specifications** in markdown define the target. Specs are binding for future asset production.

---

## 10. Ownership

| Role | Responsibility |
| --- | --- |
| **Brand owner** | Approves logo, color, photography ethics |
| **Design Kit owner** | Maintains `/design-kit`, naming, versioning |
| **Product** | Prioritizes missing assets (city heroes, etc.) |
| **Engineering** | Implements approved assets only; syncs tokens when kit updates |
| **Cursor / AI agents** | Read kit + `VISUAL-REFERENCE.md`; never invent new visual language |

### 10.1 Change request workflow

1. Propose change in kit ticket / PR limited to `/design-kit` + docs  
2. Attach before/after  
3. Brand owner approves  
4. Move asset to `approved/`  
5. Optional engineering sync sprint for tokens/components  

### 10.2 What engineers must not do

- Redesign logo in CSS  
- Recolor brand red/teal ad hoc  
- Replace city heroes with random stock  
- Invent new badge shapes  
- Add purple SaaS gradients or cream+terracotta clichés  

---

## 11. Relationship to implementation

| Layer | May change in UI sprints? |
| --- | --- |
| Approved kit assets | No — implement only |
| Token values | Only via kit-synced design sprint |
| Layout structure / routes | Product/engineering rules — not this kit |
| Copy | Product; must respect brand voice |

**This Design Kit sprint produces documentation and specifications only.** Binaries are commissioned against these specs.

---

## 12. Acceptance checklist (Design Kit v1.0)

- [x] `/design-kit` folder structure exists  
- [x] `DESIGN-KIT.md` defines governance  
- [x] `VISUAL-REFERENCE.md` is the official visual specification  
- [x] Dynamic Hero fully documented  
- [x] Photography rules documented  
- [x] 81 city asset specifications documented  
- [x] No application / React / route changes in this sprint  

---

## 13. Changelog

| Version | Date | Notes |
| --- | --- | --- |
| 1.0 | 2026-07-16 | Initial permanent Design Kit governance |
