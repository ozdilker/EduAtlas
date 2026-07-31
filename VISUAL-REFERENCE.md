# EduAtlas — Visual Reference

| Field | Value |
| --- | --- |
| **Product** | EduAtlas |
| **Document** | VISUAL-REFERENCE.md |
| **Version** | 1.0 |
| **Kit** | Design Kit v1.0 |
| **Status** | Official visual specification — binding |
| **Market** | Türkiye |
| **Last updated** | 16 July 2026 |

---

## Document control

This is the **official visual specification** of EduAtlas.

It translates brand meaning (`BRAND-GUIDELINES.md`), philosophy (`VISUAL-DIRECTION.md`), and tokens (`DESIGN-SYSTEM.md`) into an asset-ready reference that the Design Kit implements.

| Related | Role |
| --- | --- |
| `DESIGN-KIT.md` | Folder structure, naming, exports, versioning |
| `PRD.md` | Product north star / mission |
| `/design-kit/**` | Asset library + city specs |

**Critical rule:** Approved kit assets are never redesigned by implementers. Cursor implements approved assets only.

**Non-goals:** React, CSS, routes, or application code.

---

## 1. Brand Philosophy

EduAtlas is **credible infrastructure for education discovery** across Türkiye.

| Trait | Visual consequence |
| --- | --- |
| Trustworthy | Steady navy ink, sober badges, honest empty states |
| Clear | One job per section; strong type hierarchy |
| Modern | Plus Jakarta Sans UI; restrained radii; light mode first |
| Human | Editorial photography of Turkish places & campuses |
| Simple | Few accents; no sticker chrome |
| National but local | Atlas coverage + city-first heroes |

### 1.1 Feel targets

Professional · Trustworthy · Modern · Accessible · Simple

### 1.2 Anti-patterns (never)

- Purple-on-white / purple–indigo “AI SaaS” gradients  
- Warm cream + terracotta + generic display-serif cliché  
- Broadsheet / dense newspaper columns  
- Neon glow, glass stacks, emoji UI, pill-cluster chrome  
- Mascots, cartoon children, quest / gamified map stickers  
- Inventing a different visual language on mobile  

### 1.3 Dual audience, one brand

Same logo, colors, and type across Public / Owner / Admin — **different density**, not different brands.

---

## 2. Logo System

### 2.1 Official mark

Open-book / heart silhouette (Master Visual Reference — turquoise official system).

| Element | Spec |
| --- | --- |
| Left page | EduAtlas Red `#E62846` with white crescent + star |
| Right page | EduAtlas Turquoise `#00BEC7` |
| Spine / lines | Soft white page details |
| Wordmark | **Edu** Dark Navy `#0F172A` · **Atlas** Red `#E62846` |
| Tagline | “Türkiye’nin Eğitim Atlası.” |

### 2.2 Required variants

| Variant | Use |
| --- | --- |
| Full (horizontal) | Public header, footer |
| Stacked (vertical) | Marketing lockups |
| Mark / icon | Compact chrome, favicon |
| Mono | Single-color contexts |
| Small | Owner / Admin sidebars |
| App tile | Red / turquoise / navy rounded icons |

### 2.3 Clear space & size

| Rule | Spec |
| --- | --- |
| Clear space | ≥ 0.5 × mark height |
| Public header | Wordmark ~24–28px tall |
| Do not | Stretch, recolor arbitrarily, glow, reconstruct as emoji |

Asset folder: `design-kit/branding/`

---

## 3. Color System

Official Master Visual Reference palette:

| Role | Hex | Token guide |
| --- | --- | --- |
| **EduAtlas Red** | `#E62846` | Brand primary CTA on public |
| Red hover | `#C41F3A` | Brand 700 |
| Soft red wash | `#FDE8EC` | Brand 50 |
| **EduAtlas Turquoise** | `#00BEC7` | Secondary brand / Owner accent |
| Turquoise deep | `#009AA2` | Primary 700 |
| Soft turquoise wash | `#E6F9FB` | Primary 50 |
| **Dark Navy** | `#0F172A` | Ink / headings |
| **Soft Gray** | `#64748B` | Secondary text |
| **Warm White** | `#FAFAF8` | Page / soft surfaces |
| **Soft Stone** | `#F2F2F0` | Secondary background |
| Surface | `#FFFFFF` | Cards / panels |

### 3.1 Surface accents

| Surface | Accent bias |
| --- | --- |
| Public | Red CTAs; teal as secondary trust |
| Owner | Teal-led calm product chrome |
| Admin | Navy + teal density; red only for critical alerts |

### 3.2 Status colors

Use semantic success / warning / error / info from `DESIGN-SYSTEM.md`; never encode status with color alone.

Asset folder: `design-kit/colors/`

---

## 4. Typography

| Role | Family | Use |
| --- | --- | --- |
| **Display / headlines** | **Fraunces** | H1–H2 marketing & portal greetings only |
| **UI / body / nav** | **Plus Jakarta Sans** | Everything else |

### 4.1 Hierarchy (public)

| Level | Guide |
| --- | --- |
| Hero H1 | Fraunces, clamp ~2.15–3.5rem, weight 700 |
| Section H2 | Fraunces ~1.625rem |
| Card title | Jakarta Sans bold / semibold |
| Body | Jakarta 1rem / 1.55 line-height |
| Caption | Jakarta 0.8125–0.875rem, Soft Gray |

### 4.2 Rules

- Do not use Inter / Roboto / Arial / system UI as brand voice  
- Design for longer Turkish strings  
- One Fraunces headline per major section  

Asset folder: `design-kit/typography/`

---

## 5. Spacing

4px grid. Prefer scale: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`.

| Context | Rhythm |
| --- | --- |
| Marketing sections | Generous chapter spacing |
| Search results | Scannable, tighter |
| Profile | Clear section breaks; CTA isolation |
| Owner | Calm panel gutters |
| Admin | Compact table density |

White space is part of the brand — not leftover emptiness.

---

## 6. Shadows

Premium, soft, floating — not Material multi-layer stacks.

| Level | Feel | Use |
| --- | --- | --- |
| `sm` | Whisper | Resting cards |
| `md` | Soft float | Search bar, lead card, hover |
| `lg` | Editorial lift | Spotlight banners, heroes overlays |

Prefer **border + space** first; shadow second. No neon glow.

---

## 7. Buttons

| Type | Visual |
| --- | --- |
| Primary (public) | Solid EduAtlas Red, large radius / pill on marketing |
| Secondary | White / outline, Soft Gray or red border |
| Owner primary | Teal-led |
| Destructive | Error red, confirmed by label |
| Ghost | Text only, quiet |

### 7.1 Rules

- One primary per region  
- Min touch ~44px on mobile CTAs  
- Focus ring: brand/primary focus token, visible WCAG  
- Labels in Turkish; never icon-only for “Bilgi Al” / “Ara” / “Giriş Yap”

Asset folder: `design-kit/ui/`

---

## 8. Forms

| Element | Spec |
| --- | --- |
| Inputs | White surface, soft border, large radius on marketing heroes |
| Labels | Jakarta semibold, ink |
| Errors | Error text + field border; not color-only |
| Lead form | Grouped in elevated card on profiles |
| Search hero | Single wide bar: query + location chip + red “Ara” |

Honeypots remain visually hidden. Consent copy must stay readable.

---

## 9. Cards

Cards wrap **interactions** — not every block of text.

| Card | Use |
| --- | --- |
| Institution result | Search selection unit |
| Category | Hub discovery |
| City | Place discovery with photo plate |
| Recommendation | Compact list row / card |
| Owner widget | Metric / chart / list panel |
| Admin panel | Health / AI / ops unit |

### 9.1 Visual

- Radius ~16–24px  
- Soft shadow + light border  
- Hover: slight elevation (respect reduced motion)  
- No sticker badges floating on media  

Asset folder: `design-kit/cards/`

---

## 10. Hero System

### 10.1 Public homepage hero (static composition target)

Full-bleed atmospheric photography (Istanbul / local atlas feel) with centered Fraunces headline, wide search bar, popular search pills. No floating promo stickers on media.

### 10.2 Dynamic Hero (complete specification)

See **§ Dynamic Hero** below (canonical).

Asset folder: `design-kit/hero/`

---

## 11. Photography System

See **§ Photography Rules** below (canonical).

Asset folder: `design-kit/photography/`

---

## 12. City Hero System

Every province has a kit specification under `design-kit/city-assets/cities/`.

| Field | Required |
| --- | --- |
| Hero landmark | Yes |
| Alternative landmarks | Yes (≥1) |
| Recommended palette | Yes |
| Preferred seasons | Yes |
| Photography direction | Yes |
| Forbidden compositions | Yes |

City heroes power `/cities/[city]` and dynamic homepage localization.

---

## 13. Search Components

| Component | Visual notes |
| --- | --- |
| Results title | Fraunces |
| Filters / sidebar | Calm chrome; teal/red accents sparingly |
| Result cards | Clear hierarchy: name → place → badges → CTA |
| AI recommendation strip | Soft brand wash, eyebrow + badge “Statik” until personalization ships |
| Empty / loading | Honest skeletons; kit empty illustration optional |
| Favorite control | Heart language matching header Favorilerim |

Do not change ranking/filter logic in design work — visual only.

---

## 14. Institution Components

| Region | Spec |
| --- | --- |
| Hero | Cover atmosphere + logo plate + badges + primary CTA |
| Gallery | Real assets; incomplete stays honest |
| Programs | Structured list, not decorative tiles |
| Trust badges | Kit badge library only |
| Campaigns | Restrained; no FOMO countdown chrome |
| Facilities | Icon + label rows |
| Map | Quiet map embed; no cartoon pins spam |
| Lead card | Elevated sticky card; one primary submit |
| Related | Compact institution cards |
| Teachers | **Intentionally excluded** from MVP profile |

---

## 15. Owner Components

Calm product density (Stripe / Linear feel).

| Element | Spec |
| --- | --- |
| Sidebar | Light surface, official small logo, clear active state |
| Greeting | Fraunces (“Merhaba, …”) |
| Stat widgets | Soft cards, green positive deltas |
| Charts | Minimal line charts; teal/red accents only |
| Activity rail | Quiet list, timestamps |
| CTAs | Teal-led primary |

Asset folder: `design-kit/owner/`

---

## 16. Admin Components

Executive ops density.

| Element | Spec |
| --- | --- |
| Platform health | Progress bars, sober percentages |
| AI recommendations | Elevated panel; actionable rows |
| Quick actions | Icon grid from kit icons |
| Activity feed | Dense but readable |
| Tables | Compact; status badges from kit |

Asset folder: `design-kit/admin/`

---

## 17. Badge Library

| Badge | Meaning | Tone |
| --- | --- | --- |
| Doğrulanmış | Verified institution | Success / sober |
| Premium | Paid prominence | Warning/gold restrained |
| Öne çıkan | Featured | Info |
| Type label | Institution type | Primary/neutral |
| Statik | Non-personalized AI strip | Neutral |

Shape: soft radius, not candy pills. Never emoji badges.

Asset folder: `design-kit/badges/`

---

## 18. Illustration Library

Optional accents for empty / 404 / About — not wallpaper.

| Do | Don’t |
| --- | --- |
| Flat vector, limited red/teal/navy | Clipart children |
| Atlas / place / clarity metaphors | Mascots |
| Geometric line art | 3D isometric SaaS cities |
| Calm empty-state companions | Joke art undercutting trust |

Asset folder: `design-kit/illustrations/`

---

## 19. Icon Library

| Attribute | Spec |
| --- | --- |
| Style | Rounded, minimal, outlined 1.5–2px |
| Sizes | 16 / 20 / 24 |
| Color | Inherit; brand red for critical public accents |
| Feeling | Utility-first (Lucide-like), EduAtlas-consistent |

Allowed metaphors: search, pin, building, message, shield, heart, chart.

Avoid: graduation-cap spam, school-bus ornaments, skeuomorphic books in nav.

Asset folder: `design-kit/icons/`

---

## 20. Animation Rules

Motion = presence, not entertainment.

| Pattern | Duration | Notes |
| --- | --- | --- |
| Hover | ~120ms | Elevation / color |
| Enter fade | 150–200ms | Ease-out, small distance |
| Skeletons | Quiet shimmer | Disable if reduced motion |
| Page change | Instant + skeleton | No wipes / parallax |

### 20.1 Budgets

| Surface | Budget |
| --- | --- |
| Marketing home | 2–3 intentional motions |
| Search / profile | Minimal |
| Owner | Calmer than marketing |
| Admin | Near-static |

Always honor `prefers-reduced-motion: reduce`.

Asset folder: `design-kit/motion/`

---

## 21. Accessibility

| Requirement | Spec |
| --- | --- |
| Contrast | WCAG 2.2 AA for text/UI |
| Focus | Visible focus rings on all controls |
| Keyboard | Full navigability |
| Screen readers | Meaningful names; decorative assets hidden |
| Status | Never color-only |
| Motion | Reduced-motion paths |
| Language | Turkish first; do not truncate meaning for aesthetics |

Logo on photography: use solid/soft plate when contrast fails.

---

## 22. Responsive Behaviour

| Breakpoint guide | Behaviour |
| --- | --- |
| Mobile | Same language; stacked hero search; subject-centered crops |
| Tablet | Search bar horizontal; 2-up grids |
| Desktop | Concept-board composition; wider editorial heroes |

**Do not invent a different design language on mobile.**

Hero search, cards, and city plates adapt via crop/stack — not new illustration styles.

---

## 23. Asset Naming

See `DESIGN-KIT.md` §3. Canonical pattern:

```text
ea-{domain}-{name}-{variant}-{size}.{ext}
```

City files: `ea-city-{slug}-…` with slugs from `design-kit/city-assets/CITIES-INDEX.md`.

---

## 24. Future Asset Workflow

1. **Brief** — reference this document + city/photo specs  
2. **Produce** — place in `design-kit/{folder}/draft/`  
3. **Review** — brand owner  
4. **Approve** — move to `approved/`  
5. **Changelog** — `design-kit/CHANGELOG.md`  
6. **Implement** — engineering/Cursor uses approved files only  
7. **Archive** — never silent overwrite  

Missing asset ⇒ kit ticket. Never freestyle.

---

# Dynamic Hero

Canonical specification for the EduAtlas homepage (and future localized entry) hero.

## Purpose

Be the **primary discovery instrument**: orient families in place, invite search, and signal national atlas credibility without marketplace hype.

One composition: brand-aware atmosphere + one headline + one supporting line + search + light suggested chips. No sticker overlays on media.

## Behaviour

| Concern | Spec |
| --- | --- |
| Default | National / İstanbul editorial fallback when city unknown |
| Localized | When city context known (geo, cookie, last search, hub entry), swap photo, headline nuance, stats, suggestions |
| Search submit | GET `/search` with `q` (+ future city params) — behaviour owned by product; design only specifies chrome |
| Performance | WEBP responsive sources; lazy below-fold only (hero is LCP — optimize aggressively) |
| Accessibility | Text remains readable on overlays; search fully keyboardable |

## Desktop

- Full-bleed editorial photograph  
- Centered content column (~46rem)  
- Fraunces headline  
- Pill search: query · location chip · red **Ara**  
- Popular chips row beneath  
- Soft dark gradient scrim for type contrast  

## Tablet

- Same structure; slightly tighter vertical padding  
- Search remains single bar when width allows  
- Photo crop mid-tight  

## Mobile

- Subject-centered crop of same photo family  
- Stacked search fields if needed; primary **Ara** full width  
- Chips wrap; max ~5 visible suggestions  
- No alternate illustration language  

## City dropdown

| State | Spec |
| --- | --- |
| Resting | Shows current city label (e.g. İstanbul) with pin accent |
| Open | Accessible listbox of priority cities + “Tüm şehirler” → `/cities` |
| Selection | Updates hero localization (photo, stats, suggestions) without full brand redesign |
| Empty / unknown | Fallback city = İstanbul editorial |

Visual: quiet dropdown, not a map widget.

## Dynamic headline

| Mode | Example pattern (TR) |
| --- | --- |
| National | “Türkiye’nin eğitim atlası” |
| City | “{City}’de doğru eğitimi bulun” / “{City} eğitim rehberi” |
| Type+City (future) | “{City} {type} seçenekleri” |

Fraunces only. One headline. No rotating marketing slogans that feel like ads.

## Dynamic statistics

Trust bar beneath hero may localize counts when data exists:

| Slot | National example | City example |
| --- | --- | --- |
| Institutions | 25.000+ | “{n}+ kurum” |
| Families | 1.250.000+ | Optional omit if weak data |
| Coverage | 81 il | District coverage |
| Rating | 4,9 / 5 | City rating if available |

Use honest placeholders; never fake precision.

## Dynamic suggested searches

Chips pull from:

1. Popular types (Anaokulu, Dershane, …)  
2. Local districts  
3. Recent category interest (future)  

Max visual noise: ~5 chips. Red outline icon language from kit.

## Dynamic editorial photography

| Priority | Source |
| --- | --- |
| 1 | Approved city hero from kit |
| 2 | Regional fallback (e.g. Marmara plate) |
| 3 | National İstanbul plate |

Crossfade ≤200ms; disabled under reduced motion (swap stills).

## Seasonal adaptation

| Season | Direction |
| --- | --- |
| Spring | Softer morning light; campuses budding |
| Summer | Clear skies; brighter but not HDR tourist |
| Autumn | Warm late light; academic return-to-school mood |
| Winter | Cool clear light; avoid bleak empty playgrounds |

Seasonal variants are **alternate approved photos**, not filters slapped on one image.

## Future AI personalization

| Allowed | Forbidden |
| --- | --- |
| Reorder suggestions from stated preferences | Deepfake campuses |
| Headline nuance from age/type intent | Manipulative urgency copy |
| Stat emphasis relevant to user | Unlabeled synthetic faces of children |

AI strip elsewhere remains labeled until models ship. Hero personalization must stay calm and disclose when non-generic.

---

# Photography Rules

## Allowed

- Rights-cleared editorial photos of Turkish cities, campuses, study spaces  
- Natural light; authentic materials (stone, wood, daylight classrooms)  
- Adults / environments when child identity is sensitive  
- Architecture + learning atmosphere  
- Quiet human presence (backs, silhouettes, wide scenes)  

## Forbidden

- Scraped web images / watermarks  
- Stock “perfect diverse classroom” clichés as wallpaper  
- Heavy HDR, neon grades, influencer beauty filters  
- Faces of minors without releases  
- Sticker badges, emoji, promo chips composited on heroes  
- Collage grids as the primary hero idea  
- Competitor brand marks in frame  

## Composition

- Landmark or campus readable but not tourist-postcard parody  
- Leave calm negative space for type/search overlay  
- Horizon stable; avoid Dutch angles  
- Prefer single subject plane over chaotic crowds  

## Color grading

- Natural color; slight contrast OK  
- Preserve red/teal brand harmony in grade (no purple casts)  
- Soft shadows; no crushed blacks that hide landmark detail  

## Light

- Golden hour or clear morning preferred  
- Avoid harsh noon whiteout on stone  
- Interior: daylight through windows > fluorescent green cast  

## Depth

- Mild atmospheric depth OK  
- No heavy vignette / fake tilt-shift to “look premium”  

## Editorial style

Think atlas magazine / serious travel editorial — not tourism brochure, not edtech cartoon.

## Turkish identity

- Real places (Galata, Anıtkabir, Saat Kulesi, local campuses)  
- Crescent/star only inside **logo** — do not stamp flags on every photo  
- Respect regional diversity; do not reduce Türkiye to one İstanbul cliché for every city page  

---

# Document index

| Topic | Location |
| --- | --- |
| Kit governance | `DESIGN-KIT.md` |
| City specs (81) | `design-kit/city-assets/` |
| Folder READMEs | `design-kit/*/README.md` |
