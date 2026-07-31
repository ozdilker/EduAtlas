# EduAtlas — Institution Profile Specification

| Field | Value |
| --- | --- |
| **Product** | EduAtlas |
| **Document** | INSTITUTION-PROFILE-SPECIFICATION.md |
| **Version** | 1.0 |
| **Sprint** | Sprint-001 — Foundation |
| **Task** | Task-007 |
| **Status** | Binding specification for `/kurum/{slug}` |
| **Canonical URL** | `/kurum/{slug}` |
| **Last updated** | 13 July 2026 |

---

## Document control

The Institution Profile is the **single most important page** in EduAtlas. It is the primary surface for parent decision-making, lead conversion, organic ranking, trust, and claim acquisition.

| Related document | Role |
| --- | --- |
| `PRD.md` | MVP fields, lead form, claim CTA |
| `SEO-ARCHITECTURE.md` | Canonical URL, schema, internal links |
| `DOMAIN-MODEL.md` | Institution, Program, Branch, Review, etc. |
| `DATA-ACQUISITION.md` | Verification, media, quality |
| `BUSINESS-MODEL.md` | Premium, leads, placement |

**Rule:** If a UI element is not in this document (or marked Future), it is not part of the profile contract until a versioned revision.

---

## 1. Purpose

Define **everything** shown on:

```text
/kurum/{slug}
```

The same page template must support:

| Segment | MVP / Future |
| --- | --- |
| Preschool / kindergarten (kreş, anaokulu) | MVP |
| Primary school | Extensible (type taxonomy) |
| Middle school | Extensible |
| High school | Extensible |
| Course centers (dershane) | MVP |
| Language schools | MVP |
| Private education / etüt centers | MVP |
| Private schools (özel okul) | MVP |
| Universities | Future vertical |
| Future institution types | Template must not hard-collapse |

Type-specific modules show/hide by **InstitutionType** and available data—not separate hardcoded products per vertical.

---

## 2. Page goals

| Goal | How the page serves it |
| --- | --- |
| **Help parents decide** | Clear facts, programs, location, trust signals, comparable structure |
| **Generate leads** | Persistent CTAs; multiple intent actions (call, message, request info) |
| **Rank on Google** | Unique content, NAP, schema, breadcrumbs, internal links, performance |
| **Provide trusted information** | Verification/claim badges, sourced fields, moderation rules |
| **Encourage claims** | Unclaimed CTA; value of inbox + edit control |

### 2.1 Primary user jobs

1. “Is this institution right for my child / me?”  
2. “How do I contact them quickly?”  
3. “Can I trust this listing?”  

### 2.2 Success hierarchy (on-page)

```text
Trust & clarity → Contact / Lead → Claim (supply) → SEO compounding
```

---

## 3. Page structure

### 3.1 Section order (desktop)

Recommended top-to-bottom composition:

| # | Section | MVP | Notes |
| --- | --- | --- | --- |
| 1 | **Hero** | Yes | Identity + primary CTAs |
| 2 | **Gallery** | Partial | Cover required-ish; multi-image optional |
| 3 | **Quick facts** | Yes | Scannable attributes |
| 4 | **Contact** | Yes | Phone, WhatsApp, email, web, address actions |
| 5 | **Lead CTA / form** | Yes | Core conversion (also sticky on mobile) |
| 6 | **Map** | Partial | Address + directions; embed optional |
| 7 | **Description / content** | Yes | About, facilities, advantages |
| 8 | **Programs** | Partial | Summary MVP; structured list when data exists |
| 9 | **Pricing** | Optional | Only if provided; never invent |
| 10 | **Branches** | Partial | When `InstitutionBranch` exists |
| 11 | **Achievements** | Optional | Awards / results if present |
| 12 | **Teachers** | Future | Hide when empty |
| 13 | **Reviews** | Future | Hide until product ships |
| 14 | **FAQ** | Encouraged | Supports parents + FAQ schema |
| 15 | **Nearby institutions** | Yes | Same district (fallback city) |
| 16 | **Similar institutions** | Yes | Same type ± district/city |
| 17 | **Related blog** | Future / Partial | When editorial links exist |
| 18 | **Claim banner** | Yes if unclaimed | Also in hero |
| 19 | **Footer breadcrumbs echo** | Yes | Crawl + UX |

Secondary modules (scholarships detail, dormitories, events, AI assistant) appear when enabled—see Extensibility.

### 3.2 Progressive disclosure

- Empty optional modules **omit entirely** (no “Coming soon” walls on MVP).  
- Future modules must not leave empty SEO cavities.  
- Premium-only visual upgrades must not remove free-tier critical facts.

---

## 4. Hero

### 4.1 Purpose

Establish identity and trust within the first viewport; expose primary actions.

### 4.2 Elements

| Element | Required | Behavior |
| --- | --- | --- |
| **Institution name** | Yes | H1; exact display name |
| **Logo** | Recommended | Placeholder if missing |
| **Cover / hero image** | Recommended | From media set |
| **Verified badge** | Conditional | Show per verification policy (≥ V2/V3—see Data Acquisition) |
| **Claimed badge** | Conditional | When `claimStatus = claimed` |
| **Premium / Featured badge** | Conditional | Monetization; must be labeled |
| **Institution type** | Yes | Primary type label (TR) |
| **Rating** | Future / Conditional | Show only when reviews exist; otherwise omit (no fake 0.0) |
| **City** | Yes | Links to `/{city}` |
| **District** | Yes | Links to `/{city}/{district}` |
| **Favorite button** | Optional MVP+ | Requires light identity/session; if no accounts for parents, use local/device favorites or defer |
| **Claim profile button** | Yes if unclaimed | Goes to claim flow |
| **Primary lead CTA** | Yes | “Bilgi Al” / request information |
| **Call CTA** | Yes if phone | `tel:` |
| **Share** | Recommended | Web Share / copy link |

### 4.3 Hero rules

1. H1 is **name only**—do not keyword-stuff H1.  
2. Type + location appear as supporting text, not competing H1s.  
3. Unclaimed profiles show claim CTA without blocking lead form.  
4. Rating stars never appear without real aggregate data.

---

## 5. Quick facts

Scannable attribute grid. Show only facts that have values (plus always-visible type/location if not redundant with hero).

| Fact | MVP | Notes |
| --- | --- | --- |
| Institution type | Yes | Link to type hubs where useful |
| Founded year | Optional | |
| Student count | Optional | Prefer ranges if sensitive |
| Teacher count | Optional | |
| Age range | Recommended for preschool | e.g., 24–72 months |
| Education language | Optional | TR / EN / mixed |
| Boarding | Optional | Especially high school / university future |
| Scholarship | Optional | Flag + link to scholarships content |
| Transportation | Optional | Servis var/yok / areas |
| Working hours | Optional | Structured hours |
| Website | Recommended | External, `rel` policy below |
| Phone | Yes if present | |
| Email | Yes if present | |

**Rules**

- Do not display “0 students” placeholders.  
- Unknown ≠ zero; omit unknown.  
- Type-specific priority: preschool emphasizes age; dershane emphasizes exam programs; language emphasizes languages taught.

---

## 6. Programs

### 6.1 MVP display

| Mode | When | UI |
| --- | --- | --- |
| **Summary** | Always if `programsSummary` exists | Prose / bullet summary in content |
| **Structured list** | When Program entities exist | Cards/rows: name, level/age, short description, CTA “Bu program için bilgi al” |

Each structured program may deep-link later to `/kurum/{slug}/program/{program-slug}` (SEO architecture future).

### 6.2 Future filters

When program count is large (universities, large colleges):

- Filter by degree level, language, campus, duration, exam track (LGS/YKS), category.  
- Filters are on-page UX; do not create indexable query-param duplicates (keep `noindex` for filter states or use progressive enhancement without new URLs).

### 6.3 Type examples

| Type | Program examples |
| --- | --- |
| Preschool | Tam gün, yarım gün, Montessori |
| Dershane | LGS, YKS Sayısal, YKS Eşit Ağırlık |
| Language | General English, Almanca A1–B2, IELTS |
| University (future) | Computer Engineering, Medicine, MBA |

---

## 7. Media

### 7.1 Types

| Media | Purpose | MVP |
| --- | --- | --- |
| **Hero / cover image** | Visual identity | Recommended |
| **Logo** | Brand mark | Recommended |
| **Gallery** | Campus/classroom photos | Optional |
| **Videos** | Promo / tour embeds | Future / optional |
| **Virtual tour** | 360 / Matter link | Future |

### 7.2 Gallery UX

- Thumbnail strip + lightbox.  
- Keyboard operable; focus trap in lightbox.  
- Lazy-load non-LCP images.  
- Alt text required for informative images; decorative marked appropriately.

### 7.3 Rights

Follow `DATA-ACQUISITION.md` copyright rules. No scraped galleries without rights.

---

## 8. Contact

### 8.1 Elements

| Element | Action |
| --- | --- |
| **Phone** | Tap-to-call; track click; show formatted local number |
| **WhatsApp** | Deep link `https://wa.me/{e164}` with optional prefills; track |
| **Email** | `mailto:` or copy; track |
| **Website** | New tab; `rel="noopener noreferrer"`; consider `sponsored`/`ugc` only if policy requires—default noopener |
| **Directions** | Open maps provider with address/query |
| **Copy address** | Clipboard + toast confirmation |
| **Full address text** | Street, district, city — NAP consistent with schema |

### 8.2 Contact block placement

- Compact contact in hero actions.  
- Full contact section mid-page.  
- Sticky mobile bar repeats Call + Bilgi Al.

### 8.3 Missing contact

If only one of phone/email exists, emphasize it. If claim missing and contact thin, still allow lead form (platform routes to admin if unclaimed).

---

## 9. Leads & conversion actions

### 9.1 Action set

| Action | Intent | MVP |
| --- | --- | --- |
| **Call** | Immediate phone | Yes if phone |
| **Message** | WhatsApp or short message intent | WhatsApp yes if number; in-app message future |
| **Appointment** | Schedule visit | Future / optional form variant |
| **Request information** | Primary lead (PRD §10) | Yes |
| **Brochure download** | Gated file after lead or open if public | Optional; prefer after consent lead |

### 9.2 Request information (canonical lead)

Fields per PRD: full name, phone (required), email optional, role, message, preferred time optional, consent required.

**Success:** confirmation state on-page or dedicated thank-you (`noindex`).  
**Failure:** inline validation; do not lose input.

### 9.3 Lead attribution (on page)

Capture when available: `sourceSeoPageId`, UTM, referring hub, program interest if CTA from program card.

### 9.4 Unclaimed handling

Leads still submit; delivery to Admin queue until claim (domain/PRD policy).

---

## 10. Map

| Element | Spec |
| --- | --- |
| Address text | Always if available |
| Map embed | Optional MVP; recommended when coordinates exist |
| Directions CTA | Always when address exists |
| Privacy | No tracking embeds that break performance budgets without consent strategy |
| Accessibility | Map not the only way to get address |

If no coordinates: show address + directions via query string; omit broken map pins.

---

## 11. Content modules

### 11.1 Institution description

- Unique, parent-facing prose (required for publish).  
- Structured subheadings allowed (H2/H3)—do not create multiple H1s.  
- Anti-spam: no keyword walls.

### 11.2 AI summary

| Rule | Spec |
| --- | --- |
| Placement | Optional callout below description |
| Label | Clearly labeled as summary if AI-assisted |
| Gate | Human-approved per data/SEO policy before index reliance |
| Fallback | Hide if none |

### 11.3 Facilities

List/chips: garden, lab, pool, library, security, cafeteria, etc. Omit empty.

### 11.4 Advantages

Short differentiators (“Small class sizes”, “Bilingual staff”)—owner/admin provided; moderated.

### 11.5 Admission requirements

Free text or checklist; important for schools/universities; optional for language cafes-style centers.

### 11.6 Scholarships

Summary + conditions; link to future Scholarship entities; never invent amounts.

### 11.7 FAQ

- 3–8 real Q&As when possible.  
- Drives FAQ schema only if visible.  
- Can be templated lightly per type but must allow unique answers.

---

## 12. Branches

When `InstitutionBranch` records exist:

- List branch name, district, phone, link to map/directions.  
- Mark primary branch.  
- Lead form may include optional branch selector.

If single location encoded only on Institution, do not invent a Branches section.

---

## 13. Teachers (future)

| Element | Spec |
| --- | --- |
| Card | Photo, name, title, short bio |
| Link | Optional future teacher URL |
| Empty | Section hidden |
| Trust | No scraped personal data without rights |

---

## 14. Achievements

Optional module for awards, exam result highlights, accreditations.

Rules:

- Prefer verifiable claims.  
- No misleading ranking statements.  
- Moderated on claimed profiles.

---

## 15. Reviews (future)

### 15.1 Display (when shipped)

- Aggregate rating in hero.  
- Review list with date, rating, text, author display name.  
- Sort: newest / highest (default newest).  

### 15.2 Verification

- Prefer reviewers with completed interaction signals (policy TBD).  
- Verified parent badge only with strict rules.

### 15.3 Moderation

- Pending Review lifecycle before public.  
- Institution may flag; cannot edit stars/text.  
- Admin remove for abuse/PII/defamation policy.

### 15.4 Spam protection

- Rate limits, device signals, profanity/PII filters, duplicate detection.  
- Block incentivized review schemes.

Until launch: **no review UI, no Review schema, no fake aggregates**.

---

## 16. Related content

| Module | Logic | MVP |
| --- | --- | --- |
| **Nearby institutions** | Same district first; else same city; exclude self | Yes |
| **Same district** | Explicit subset / alias of nearby | Yes |
| **Same category / type** | Same primary type; prefer same district then city | Yes |
| **Same price range** | Future when pricing structured | Future |
| **Blog articles** | Editorial links tagged to city/type/institution | Partial/Future |

### 16.1 SEO rules for modules

- Use descriptive anchors (“Kadıköy’deki diğer anaokulları”).  
- Link to district×type hub as “Tümünü gör”.  
- Cap count (e.g., 6–12) to protect performance.  
- Do not link unpublished institutions.

---

## 17. SEO

Align with `SEO-ARCHITECTURE.md`. Profile-specific contract:

### 17.1 Meta

| Element | Specification |
| --- | --- |
| **Title** | `{Name} \| {Type} \| {District}, {City} \| EduAtlas` |
| **Meta description** | Unique; from short description; ~140–160 chars ideal |
| **Canonical** | `https://{domain}/kurum/{slug}` |
| **Robots** | `index,follow` iff Published; else not public / `noindex` |
| **H1** | Institution name |
| **Breadcrumb** | Home › City › District › Type › Name |

### 17.2 Social

| Element | Spec |
| --- | --- |
| **Open Graph** | `og:title`, `og:description`, `og:image`, `og:url`, `og:type=website` |
| **Twitter** | `summary_large_image` card equivalents |

### 17.3 Structured data (JSON-LD)

| Schema | When |
| --- | --- |
| **EducationalOrganization** / **School** | MVP institution pages |
| **Organization** | Compatible properties as needed |
| **LocalBusiness** | Optional additional type when accurate for local centers; do not misuse for entities that are not local businesses |
| **BreadcrumbList** | Always on profile |
| **FAQPage** | Only if FAQ visible |
| **Review` / `AggregateRating`** | Only when real reviews ship |
| **CollegeOrUniversity` / university-specific** | Future university vertical |
| **Offer` / pricing** | Only if public pricing truly offered |

Visible NAP must match schema. No schema for unpublished pages.

### 17.4 Internal links (mandatory)

City, district, national type, city×type, district×type, related peers—per SEO architecture.

---

## 18. Mobile UX

| Pattern | Spec |
| --- | --- |
| **Sticky CTA bar** | Call + Bilgi Al (and WhatsApp if space); does not obscure critical content permanently |
| **Tap to call** | Large hit targets (≥ 44px) |
| **Map** | Secondary; address first |
| **Image gallery** | Swipeable; lightbox |
| **Lead form** | Minimal typing friction; correct `inputmode` for phone |
| **Claim CTA** | Accessible without hunting |
| **Performance** | Hero image prioritized; below-fold deferred |

Avoid full-screen popups on entry that tank Core Web Vitals and trust.

---

## 19. Performance

| Area | Target / rule |
| --- | --- |
| **LCP** | Hero image or H1 text block optimized; aim “good” CWV on mobile |
| **CLS** | Reserve space for logo/cover/CTA bar; no late-injected sticky shift |
| **Image optimization** | Modern formats, responsive `srcset`, compressed |
| **Lazy loading** | All non-LCP images/iframes |
| **ISR / caching** | Public profiles cacheable; revalidate on publish/update (architecture implements) |
| **JS budget** | Form + gallery without shipping unused review/map stacks when empty |
| **Third parties** | Map/analytics consent-aware; defer where possible |

Thank-you / preview routes must not poison cache of canonical profile.

---

## 20. Accessibility

Target **WCAG 2.2 Level AA** for profile template.

| Area | Requirements |
| --- | --- |
| **Keyboard** | All CTAs, gallery, form, dialogs operable |
| **Screen readers** | Semantic headings, landmarks, label associations |
| **Alt text** | Meaningful images described; decorative empty alt |
| **Contrast** | Text/UI contrast AA; badges not text-only color |
| **Focus** | Visible focus; lightbox focus trap + escape |
| **Errors** | Form errors announced and linked to fields |
| **Motion** | Respect reduced motion for carousels |

Language: `lang="tr"` on page.

---

## 21. Analytics

Every critical interaction must be trackable (names illustrative; keep a single event dictionary in implementation planning).

### 21.1 Page & engagement

| Event | Trigger |
| --- | --- |
| `profile_view` | Page view (with institution id, type, city, district, claim status, premium flags) |
| `profile_scroll_depth` | 25/50/75/100% |
| `gallery_open` | Lightbox/gallery open |
| `gallery_navigate` | Next/prev |
| `faq_expand` | FAQ item open |
| `share_click` | Share / copy link |
| `favorite_toggle` | Add/remove favorite |
| `map_interact` | Directions / map open |
| `related_click` | Nearby/similar card click |
| `hub_click` | Breadcrumb or hub link click |

### 21.2 CTA & contact

| Event | Trigger |
| --- | --- |
| `cta_request_info_click` | Primary lead CTA |
| `cta_call_click` | Phone click |
| `cta_whatsapp_click` | WhatsApp click |
| `cta_email_click` | Email click |
| `cta_website_click` | Website click |
| `cta_directions_click` | Directions |
| `cta_copy_address` | Copy address |
| `cta_claim_click` | Claim profile |
| `cta_appointment_click` | Future |
| `cta_brochure_click` | Brochure |

### 21.3 Lead funnel

| Event | Trigger |
| --- | --- |
| `lead_form_start` | First field focus |
| `lead_form_validation_error` | Client validation fail |
| `lead_submit_attempt` | Submit |
| `lead_submit_success` | Server success |
| `lead_submit_failure` | Server/network fail |

### 21.4 Monetization analytics

| Event | Trigger |
| --- | --- |
| `premium_badge_impression` | Badge seen |
| `sponsored_module_impression` | Sponsored related slot seen |
| `sponsored_module_click` | Click |
| `lead_attributed` | Lead saved with attribution payload |

PII: analytics must not send message body or full phone in clear event props—use ids and hashed/truncated forms if needed.

---

## 22. Monetization

Aligned with `BUSINESS-MODEL.md`. Profile must support without breaking trust.

| Feature | Free | Premium / paid |
| --- | --- | --- |
| Core facts, contact, lead form | Yes | Yes |
| Claim | Yes | Yes |
| **Premium profile** styling / gallery limits raised | Limited | Expanded |
| **Featured badge** | No | Yes (labeled) |
| **Sponsored placement** on related/hubs | No | Inventory elsewhere; profile may show “Öne çıkan” label |
| **On-profile ads** | Avoid early; if ever, clearly labeled and non-intrusive | Phase 2 |
| **Lead attribution** | Always tracked | Paid packages consume attribution commercially off-page |

**Rules**

1. Paid badges disclosed.  
2. Organic related modules not replaced entirely by ads.  
3. Lead form never paywalled for parents.

---

## 23. Extensibility

Template extension points (hide when inactive):

| Extension | Profile impact |
| --- | --- |
| **Universities** | Faculties, degrees, YÖK fields, `CollegeOrUniversity` schema |
| **Courses** | Course list beyond programs |
| **Events** | Open day cards + Event schema |
| **Scholarships** | Structured scholarship module |
| **Dormitories** | Housing facts for boarding / higher ed |
| **AI assistant** | Optional chat for FAQs; never invent NAP; disclose AI |
| **Multi-language UI** | Future; MVP Turkish only |
| **Comparisons** | “Compare” CTA to future tool (`noindex` pairs) |

Extension principle: **additive modules + type config**, not forks of `/kurum/{slug}`.

---

## 24. State variants

| State | UX |
| --- | --- |
| Published + unclaimed | Full public page + claim CTAs |
| Published + claimed | Claimed badge; no claim CTA; owner may preview extras later |
| Published + premium | Premium visuals/badge |
| Draft / archived | Not public |
| Soft-closed | Archived; optional notice if redirecting |
| Minimal seed | Placeholders for media; still must meet publish required fields |

---

## 25. Permissions (page-level)

| Actor | Can see public profile | Can edit via panel |
| --- | --- | --- |
| Anonymous parent | Yes if Published | No |
| InstitutionOwner | Yes | Yes (approved) |
| Admin | Yes (+ previews) | Yes |
| Search engine | Published HTML | N/A |

---

## 26. Success metrics

| Metric | Definition | Intent |
| --- | --- | --- |
| **CTR** | Search impression → profile click; also hub → profile CTR | SEO & discovery |
| **Lead conversion** | `lead_submit_success` / `profile_view` | Core business |
| **Bounce rate** | Single-page sessions / views | Relevance & UX |
| **Time on page** | Engaged time | Content usefulness |
| **Favorites** | Favorite toggles / views | Intent signal |
| **Profile claims** | Claim starts & approvals from profile CTA | Supply growth |
| **Call / WhatsApp CTR** | Contact clicks / views | High-intent alternate conversions |
| **Gallery engagement** | Opens / views | Media quality signal |
| **Scroll to lead form** | Depth proxy | Layout effectiveness |

Segment metrics by type, city, claim status, premium vs free.

---

## 27. Acceptance criteria (MVP profile)

- [ ] Canonical `/kurum/{slug}` renders for Published institutions  
- [ ] Hero shows name (H1), type, city, district, primary CTAs  
- [ ] Quick facts omit empty fields  
- [ ] Contact actions work (tel, mail, WhatsApp if present, copy address, directions)  
- [ ] Lead form meets PRD fields + consent; success/failure handled  
- [ ] Claim CTA visible when unclaimed  
- [ ] Description unique and visible to crawlers  
- [ ] Breadcrumbs + hub internal links present  
- [ ] JSON-LD EducationalOrganization + BreadcrumbList valid for sample set  
- [ ] Nearby + similar modules exclude self and unpublished  
- [ ] Mobile sticky CTA does not break accessibility  
- [ ] No Review/Rating UI or schema without real reviews  
- [ ] Analytics events fire for view, CTAs, lead success  
- [ ] LCP image prioritized; lazy gallery  

---

## 28. Open decisions

1. Parent **favorites** without accounts: local storage vs defer.  
2. Public **verified** badge threshold (V2 vs V3).  
3. Map provider choice & consent.  
4. Whether WhatsApp prefills include institution name.  
5. Brochure gating: always after lead vs public PDF.  

---

## 29. Approval

| Role | Name | Date | Sign-off |
| --- | --- | --- | --- |
| Product | | | ☐ |
| Design / UX | | | ☐ |
| SEO | | | ☐ |
| Engineering | | | ☐ |

**Summary:** `/kurum/{slug}` is EduAtlas’s decision + conversion + SEO engine: a type-extensible profile with hero, facts, contact, content, programs, map, FAQ, related institutions, and persistent lead CTAs—honest about future modules (reviews, teachers, universities), strict on trust and schema, and instrumented for product and monetization learning.
