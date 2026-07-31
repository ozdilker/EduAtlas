# EduAtlas — Brand Guidelines

| Field | Value |
| --- | --- |
| **Product** | EduAtlas |
| **Document** | BRAND-GUIDELINES.md |
| **Version** | 1.0 |
| **Release** | Release-001 |
| **Status** | Binding brand source of truth |
| **Market** | Türkiye |
| **Locale (MVP)** | Turkish (`tr-TR`) |
| **Last updated** | 15 July 2026 |

---

## Document control

This document defines **who EduAtlas is** as a brand: personality, voice, logo, spacing rhythm, iconography, illustration, photography, motion, and accessibility expectations for brand expression.

It is the permanent brand companion to:

| Document | Role |
| --- | --- |
| `VISUAL-DIRECTION.md` | Design philosophy, surface philosophies, hierarchy & white-space |
| `DESIGN-SYSTEM.md` | Tokens, components, semantic color & type specs |
| `PRD.md` | Product mission, users, MVP scope |
| `UI-ARCHITECTURE.md` | Screens & shells |
| `NAVIGATION.md` | Wayfinding & CTAs |

**Non-goals:** CSS implementation, React components, asset binaries, or final campaign copy decks.

**Conflict rule:** If UI implementation disagrees with this document, **update the UI** — do not quietly invent a second brand. Token values live in `DESIGN-SYSTEM.md`; brand *meaning* lives here.

---

## 1. Brand personality

EduAtlas is **credible infrastructure for education discovery** — not a toy app, not a government form dump, not a loud consumer marketplace.

| Trait | Meaning | Expression |
| --- | --- | --- |
| **Trustworthy** | Families decide under stress; every screen must feel steady | Teal-ink primary, sober verification, clear NAP, no gimmicks |
| **Clear** | One job per region; no decorative noise | Strong hierarchy, plain language, progressive disclosure |
| **Modern** | Contemporary product craft without “AI SaaS” cliché | Plus Jakarta Sans, 4px grid, restrained radii, light mode first |
| **Human** | Local, familial, respectful of Turkish education context | Real campuses, parent-centered copy, empathy without infantilizing |
| **Simple** | Few accents in one view; calm density | Open layout first; cards only when they wrap an interaction |
| **National but local** | Türkiye-wide atlas with city/district reality | Local-first search cues; never erase place with national brand spam |

### 1.1 Personality we are not

| Avoid | Why |
| --- | --- |
| Playful edtech mascot brand | Undermines parent trust at decision time |
| Cold bureaucracy | Feels like paperwork, not help |
| Fintech neon / purple gradient SaaS | Generic and off-mission |
| Clickbait marketplace energy | Education is a high-stakes choice |
| Over-illustrated children’s storybook UI | Stereotypes children; clashes with portal seriousness |

### 1.2 Brand test (public first viewport)

After removing navigation chrome, a stranger should still recognize **EduAtlas** as the product brand — not a replaceable “search box + teal button” template. The wordmark/brand signal must be hero-level on marketing surfaces.

---

## 2. Mission expression

### 2.1 Mission (product)

> EduAtlas helps parents discover, compare, and contact educational institutions across Türkiye — starting with private schools, dershaneler, etüt merkezleri, language schools, kindergartens, and preschool institutions.

### 2.2 How the brand expresses the mission

| Mission verb | Brand visual / verbal cue |
| --- | --- |
| **Discover** | Search-first surfaces, atlas metaphor (coverage + place), calm exploration rhythm |
| **Compare** | Scannable facts, consistent profile anatomy, honest empty/incomplete states |
| **Contact** | One primary CTA (“Bilgi Al”), clear lead success, institution-owned response path |

### 2.3 Atlas metaphor (use carefully)

“Atlas” implies **map, coverage, orientation** — not pirate maps, not gamified pins, not heavy cartography chrome.

Allowed metaphors:

- Quiet geographic orientation (city → district → institution)  
- Completeness / coverage as informational, not gamified XP  

Disallowed metaphors:

- Cute map stickers on heroes  
- Treasure / quest / “level up your school” language  
- Globes as decorative mascots in product chrome  

### 2.4 Dual audience, one brand

| Audience | Brand stance |
| --- | --- |
| **Parents / students** | Empathetic clarity; reduce decision anxiety |
| **Institution owners** | Professional calm; tools that feel like serious Ops, not a brochure |
| **Admins** | Operational trust; density without cruelty |

Same logo, same teal, same type — **different density and chrome**, not different brands.

---

## 3. Logo rules

### 3.1 Lockups

| Lockup | Use |
| --- | --- |
| **Primary** | Symbol + “EduAtlas” wordmark |
| **Compact** | Symbol-only when space is constrained **and** the mark is already established in context |
| **Owner product** | “EduAtlas Owner” or Owner wordmark variant in portal chrome — same family, not a new identity |
| **Admin** | Same family; denser placement, never a third logo concept |

### 3.2 Clear space & size

| Rule | Spec |
| --- | --- |
| Clear space | ≥ **0.5 ×** wordmark height on all sides |
| Header height | Wordmark ≈ **24–28px** tall on public desktop header |
| Minimum | Do not shrink below legible TR-capable sizes; prefer symbol-only before illegible wordmark |
| Touch / mobile | Keep logo tappable area comfortable; do not crowd against menu/search |

### 3.3 Color & contrast

| Context | Treatment |
| --- | --- |
| Light UI | Primary teal/ink mark on `neutral.0` / `neutral.25` |
| Photography | Place logo on a solid or soft plate when contrast fails |
| Dark surfaces (future) | Use approved inverse lockup only — never ad-hoc recolor |

### 3.4 Do not

- Stretch, skew, or rotate the mark  
- Apply glow, gradients, drop-shadow stacks, or outlines for “pop”  
- Recolor to arbitrary brand-of-the-week hues  
- Place on busy photo clutter without a plate  
- Reconstruct the logo in emoji, icons, or illustrative animals  
- Mix unofficial font approximations of the wordmark in marketing assets  

### 3.5 Co-branding & partners

Partner marks sit **secondary**; EduAtlas clear-space rules still apply. Never lock EduAtlas into another brand’s purple/cream template.

---

## 4. Spacing

Brand spacing inherits the **4px grid** defined in `DESIGN-SYSTEM.md`. Guidelines emphasize *feeling*, not token tables.

### 4.1 Principles

| Principle | Guidance |
| --- | --- |
| **Breath equals trust** | White space is part of the brand — not empty leftover |
| **Rhythm over randomness** | Prefer spacing scale steps (`4 → 8 → 12 → 16 → 24 → 32 → 48…`) |
| **One density per shell** | Public comfortable · Owner medium · Admin compact |
| **Turkish string honesty** | Leave room for longer labels; do not compress TR into EN-sized buttons |

### 4.2 Contextual rhythm

| Context | Felt spacing |
| --- | --- |
| Marketing sections | Generous vertical gaps; sections should feel like chapters |
| Search / results | Tighter between filters and results; cards need scannable gaps |
| Institution profile | Content stacking with clear section breaks; CTA isolation |
| Owner portal | Calm panels; sidebar and content gutter clearly separated |
| Admin tables | Compact cells; avoid marketing-scale padding |

### 4.3 Anti-patterns

- Tight packing that makes education UI feel like a denser news portal  
- Huge empty voids that feel unfinished  
- Mixing marketing hero padding inside portal widgets  

Full token list: `DESIGN-SYSTEM.md` § Spacing.

---

## 5. Iconography

### 5.1 Style

| Attribute | Spec |
| --- | --- |
| Style | Outlined, geometric, **1.5–2px** stroke, rounded joins |
| Feeling | Utility-first (Lucide-like), not hand-drawn whimsy |
| Color | Inherit text color; semantic colors only for status |
| Filled | Rare — active nav, selected states only |

### 5.2 Sizing

**16 / 20 / 24px** aligned to text. Icons support labels; they do not replace critical CTAs (“Bilgi Al” stays text).

### 5.3 Usage rules

- Prefer text + icon over icon-only for primary parent actions  
- Icon-only controls require accessible names  
- No emoji as product chrome icons  
- No skeuomorphic book/apple clipart in navigation  
- Status must never be color-only — pair with text or icon meaning  

### 5.4 Education metaphors in icons

Allowed when abstract and quiet: location pin, search, building, message, check, shield (verification).

Avoid: cartoon kids, graduation-cap spam on every screen, school-bus ornaments.

---

## 6. Illustration style

Illustrations are **optional accents** for empty states, About, and rare marketing moments — never required wallpaper.

### 6.1 Style principles

| Do | Don’t |
| --- | --- |
| Flat vector, limited palette (primary teal + neutrals) | Clipart children stereotypes |
| Abstract education / map / atlas metaphors | Mascot characters with personalities |
| Geometric line art aligned to UI radii | 3D renders, isometric SaaS cities |
| Monochrome or single-accent compositions | Rainbow gradients, sticker piles |
| Calm empty-state companionship | Joke illustrations that undercut lead quality |

### 6.2 When to illustrate

| Surface | Guidance |
| --- | --- |
| Empty search / no leads | Optional; message + primary action remain primary |
| Marketing home | Prefer photography atmosphere; illustration secondary if used |
| Portal / admin | Prefer typography + empty-state copy; illustration rare |
| Error pages | Simple, sober line art OK |

### 6.3 Brand constraint

If an illustration could be dropped onto another edtech site unchanged, it is too generic — refine palette, geometry, and metaphor to EduAtlas (atlas / place / clarity).

---

## 7. Photography style

Photography carries **human trust** on public surfaces. Portals stay quieter.

### 7.1 Subject matter

| Preferred | Avoid |
| --- | --- |
| Real campuses, classrooms, study spaces (rights-cleared) | Stock “perfect diverse kids” montages overused as wallpaper |
| Natural light; authentic Turkish educational contexts | Heavy HDR, neon filters, influencer-style crops |
| Architecture + learning atmosphere | Faces of minors without proper releases |
| Context for discovery (place, type, environment) | Scraped web images with watermarks |

### 7.2 Treatment

- Natural color; slight contrast OK  
- No heavy vignette/glow stacks  
- Institution galleries: real assets; incomplete galleries should look honest, not padded with lorem photos  

### 7.3 Layout rules

| Rule | Spec |
| --- | --- |
| Home hero | Full-bleed visual plane allowed; **no sticker overlays** (badges floating on media) |
| Hubs | Prefer typography + light atmosphere over collage grids |
| Cards | Media supports selection; do not decorate every panel with photos |
| Logo on photo | Use plate when contrast fails |

### 7.4 Ethics

Respect privacy of children and families. Prefer environments and adults in staff contexts when identity is ambiguous. Never publish scraped personal photos.

---

## 8. Motion principles

Motion is **presence, not entertainment**. EduAtlas should feel as calm as Stripe/Linear product surfaces, with slightly more life only on marketing home.

### 8.1 Intent

| Intent | Example |
| --- | --- |
| Confirm interaction | Button hover, selected row border |
| Orient | Soft fade-in of hero or portal main |
| Wait honestly | Skeleton shimmer / spinner — subtle |
| Avoid | Parallax hubs, page wipes, bounce springs, confetti |

### 8.2 Timing (brand defaults)

Align to `DESIGN-SYSTEM.md` § Motion:

| Pattern | Duration | Feel |
| --- | --- |
| Hover | ~120ms | Instant credibility |
| Fade / soft move | 150–200ms | Ease-out, small distance |
| Loading | Linear loop | Quiet shimmer, not carnival |
| Page change | Prefer instant + skeleton | No theatrical transitions |

### 8.3 Surface intensity

| Surface | Motion budget |
| --- | --- |
| Marketing home | 2–3 intentional motions (search focus, hero fade, CTA hover) |
| Search / profile | Minimal hover and state change only |
| Owner portal | Calmer than marketing; no decorative loops |
| Admin | Near-static chrome; functional feedback only |

### 8.4 Accessibility

Always respect `prefers-reduced-motion: reduce` — snap to end states; disable shimmer loops.

---

## 9. Voice & tone

MVP locale is **Turkish**. English may appear in internal docs and rare bilingual legal contexts; product UI voice is TR-first.

### 9.1 Voice attributes

| Attribute | Guidance |
| --- | --- |
| **Direct** | State what to do next; avoid fluff |
| **Respectful** | Parents are adults under time pressure |
| **Honest** | Incomplete profiles stay incomplete — do not fake richness |
| **Warm enough** | Empathy without baby-talk |
| **Institution-capable** | Owner copy sounds like professional tools |

### 9.2 Tone by moment

| Moment | Tone |
| --- | --- |
| Search empty | Helpful: suggest filters / cities / types |
| Lead form | Clear, consent-aware, low anxiety |
| Lead success | Calm confirmation + next option |
| Claim / owner | Competent, operational, not salesy hype |
| Errors | Specific, recoverable, never blaming |
| Premium / featured | Explicit labels — never dark-pattern urgency |

### 9.3 Microcopy patterns

| Prefer | Avoid |
| --- | --- |
| “Bilgi Al”, “Kurumunu Sahiplen”, “Taleplere dön” | Vague “Keşfet dünyasını!” slogans |
| Sentence case Turkish | ALL-CAPS long Turkish strings |
| Short supporting sentence under one headline | Stacks of competing headlines |
| Explicit missing-field hints for owners | Shame language (“Profiliniz zayıf!”) |

### 9.4 Brand voice test

If copy could sell sneakers, crypto, or a food delivery app unchanged, rewrite until it belongs to **education discovery in Türkiye**.

---

## 10. Accessibility

Accessibility is a **brand promise**: trustworthy products include everyone.

### 10.1 Standard

**WCAG 2.2 Level AA** is a release gate for Release-001 surfaces — not a later polish pass.

### 10.2 Brand-facing requirements

| Area | Requirement |
| --- | --- |
| Contrast | Text/icon vs surfaces meet AA; verify primary teal buttons |
| Focus | Visible ≥ 2px ring; never remove outline without replacement |
| Keyboard | Full operability; dialogs trap focus; Esc closes overlays |
| Touch | Primary targets ≥ 44×44px on mobile |
| Screen readers | Landmarks, labels, live regions for status |
| Color | Never status-by-color-alone |
| Zoom | Usable at 200% |
| Motion | Honor reduced-motion preferences |
| Language | `lang` appropriate; Turkish labels not truncated into unreadability |

### 10.3 Inclusive content

- Avoid idioms that exclude  
- Alt text for informative images; empty alt for decorative  
- Do not rely on photos alone to convey critical facts (address, phone, verification)  

### 10.4 Brand anti-patterns that harm a11y

- Low-contrast teal-on-teal decorative text  
- Ghost buttons on photos without plates  
- Auto-playing motion on discovery hubs  
- Icon-only lead CTAs  

Detail specs: `DESIGN-SYSTEM.md` § Accessibility.

---

## 11. Brand governance

### 11.1 Ownership

| Concern | Owner |
| --- | --- |
| Brand meaning & voice | Product + Design (this document) |
| Tokens & components | `DESIGN-SYSTEM.md` + `packages/ui` |
| Screen structure | `UI-ARCHITECTURE.md` |
| Visual philosophy by surface | `VISUAL-DIRECTION.md` |

### 11.2 Change control

Material brand changes (logo geometry, personality shift, photography ethics, voice) require an explicit document revision — not silent UI drift.

### 11.3 Release-001 checklist

- [ ] Logo clear-space respected on public header and home  
- [ ] Teal-ink identity recognizable without purple/cream clichés  
- [ ] Parent CTAs use approved voice  
- [ ] Owner portal reads as same brand, quieter density  
- [ ] Motion stays subtle; reduced-motion honored  
- [ ] AA contrast and focus verified on primary flows  

---

## Summary

EduAtlas’s brand is **clear, trustworthy, modern, and human** — an atlas for education discovery in Türkiye. Express the mission through search clarity, honest comparison, and calm contact — never through gimmicks. This document is the permanent brand source of truth for Release-001 and beyond.
