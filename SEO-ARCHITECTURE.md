# EduAtlas — SEO Architecture

| Field | Value |
| --- | --- |
| **Product** | EduAtlas |
| **Document** | SEO-ARCHITECTURE.md |
| **Version** | 1.0 |
| **Sprint** | Sprint-001 — Foundation |
| **Task** | Task-005 |
| **Status** | Binding SEO strategy & URL architecture |
| **Market** | Türkiye |
| **Primary locale** | Turkish (`tr-TR`) |
| **Last updated** | 13 July 2026 |

---

## Document control

This document defines the **long-term SEO architecture** for EduAtlas. It must scale from thousands to **hundreds of thousands** of indexable URLs without thin-content collapse.

| Related document | Role |
| --- | --- |
| `PRD.md` | MVP SEO requirements and acceptance criteria |
| `DOMAIN-MODEL.md` | `SEOPage`, geography, type, Institution, Program, BlogPost |
| `BUSINESS-MODEL.md` | Organic search as primary acquisition |
| `PROJECT-DASHBOARD.md` | Launch framing |

**Objective:** EduAtlas becomes **Türkiye’s largest education discovery platform**. Organic search is the **primary acquisition channel** for parents and students.

---

## 1. Strategic principles

1. **Intent → one primary URL** — each landing page owns a clear query cluster.  
2. **Hierarchy mirrors how parents search** — city → district → type → institution.  
3. **Index only valuable pages** — never mass-index empty or boilerplate-only URLs.  
4. **Stable institution canonicals** — institution identity survives geo/type edits via redirects.  
5. **Internal links are the crawl graph** — hubs and institutions reinforce each other.  
6. **Turkish-first content** — titles, copy, slugs, and schema in Turkish for MVP.  
7. **Scale by template + supply gates** — page types are finite; URL count grows with real institutions.  
8. **SEO is product, not marketing garnish** — shipping without hubs fails launch criteria.

### 1.1 Scale model

| Layer | Approximate URL drivers | Scale notes |
| --- | --- | --- |
| Cities | ~81 | Near-fixed |
| Districts | ~1.000 | Near-fixed |
| Types (MVP) | 6 (+ future types) | Small |
| City × type | 81 × types | Index when supply ≥ 1 |
| District × type | districts × types | Index when supply ≥ 1 |
| Institutions | thousands → 100k+ | Primary long-term growth |
| Programs (future) | institutions × programs + national hubs | Secondary wave |
| Blog / guides | hundreds → low thousands | Editorial quality bar |

**Anti-pattern:** generating all district×type×facet combinations without institutions. That creates soft-404 scale and hurts the whole domain.

---

## 2. Site hierarchy

### 2.1 Conceptual hierarchy

```text
Türkiye (Home / national discovery)
 └── City (il)
      └── District (ilçe)
           └── Institution Type (kurum tipi)
                └── Institution (kurum)
                     └── Program (optional / future)
```

### 2.2 Hierarchy with examples

```text
EduAtlas (Türkiye)
 │
 ├─ /ankara
 │    ├─ /ankara/cankaya
 │    │    ├─ /ankara/cankaya/dershane
 │    │    ├─ /ankara/cankaya/dil-kursu
 │    │    ├─ /ankara/cankaya/anaokulu
 │    │    └─ → institutions in Çankaya matching type
 │    ├─ /ankara/dershane          (city + type)
 │    └─ /ankara/cankaya/…/…      (deeper only when justified)
 │
 ├─ /istanbul
 │    ├─ /istanbul/kadikoy
 │    ├─ /istanbul/kadikoy/anaokulu
 │    └─ /istanbul/universiteler   (future vertical hub)
 │
 ├─ /dershane                     (national type)
 ├─ /anaokulu
 │
 ├─ /kurum/ornek-kolej            (canonical institution)
 └─ /blog/...                     (editorial)
```

### 2.3 Breadcrumb pattern (public)

Example for an institution in Ankara / Çankaya / dershane:

```text
Ana Sayfa › Ankara › Çankaya › Dershane › Örnek Dershane
```

Example for a district×type hub:

```text
Ana Sayfa › Ankara › Çankaya › Dil Kursu
```

---

## 3. Landing page types

Every public SEO surface maps to a `SEOPage.pageType` (see domain model). Below is the **complete landing page catalog**.

### 3.1 Catalog

| # | Page type | URL pattern | Primary intent examples | MVP |
| --- | --- | --- | --- | --- |
| L0 | Home | `/` | Brand + national entry | Yes |
| L1 | City | `/{city}` | `ankara özel okul`, `ankara eğitim` | Yes |
| L2 | District | `/{city}/{district}` | `çankaya anaokulu` (via children), local discovery | Yes |
| L3 | National type | `/{type}` | `dershane`, `dil kursu`, `anaokulu` | Yes |
| L4 | City + type | `/{city}/{type}` | `ankara dershane`, `istanbul anaokulu` | Yes |
| L5 | District + type | `/{city}/{district}/{type}` | `çankaya dershane`, `kadıköy dil kursu` | Yes |
| L6 | Institution | `/kurum/{institution-slug}` | Brand + local modifiers | Yes |
| L7 | Static trust | `/hakkimizda`, `/iletisim`, `/gizlilik`, `/kullanim-kosullari` | Brand/trust | Yes |
| L8 | Search results | `/ara?...` | Faceted discovery | Conditional |
| L9 | Program hub (national) | `/program/{program-slug}` | `yks`, `lgs`, `ingilizce` | Future |
| L10 | Program @ institution | `/kurum/{slug}/program/{program-slug}` | Institution offering detail | Future |
| L11 | Blog index | `/blog` | Guides hub | Future / Partial |
| L12 | Blog post | `/blog/{post-slug}` | Informational queries | Future / Partial |
| L13 | Future vertical hub | `/{city}/{vertical}` e.g. `/istanbul/universiteler` | Expansion verticals | Future |
| L14 | Comparison (future) | `/karsilastir/...` | Commercial investigation | Future |
| L15 | City report (future) | `/rapor/{city}` | Research / PR / links | Future |

### 3.2 Landing page specifications

#### L0 — Home

| Element | Spec |
| --- | --- |
| Purpose | Explain EduAtlas; route into cities, types, search |
| Index | Yes |
| Content | Unique H1, short value prop, entry modules to priority cities/types |
| Avoid | Thin doorway of only links with no copy |

#### L1 — City (`/ankara`)

| Element | Spec |
| --- | --- |
| Purpose | City education discovery hub |
| H1 example | `Ankara’da Eğitim Kurumları` |
| Must include | Intro copy; links to districts with supply; links to city×type hubs; institution list (paginated) |
| Index gate | ≥ 1 published institution in city |

#### L2 — District (`/ankara/cankaya`)

| Element | Spec |
| --- | --- |
| Purpose | Local discovery hub |
| H1 example | `Çankaya’da Eğitim Kurumları` |
| Must include | District intro; type links present in district; institution list |
| Index gate | ≥ 1 published institution in district |

#### L3 — National type (`/dershane`)

| Element | Spec |
| --- | --- |
| Purpose | National vertical |
| H1 example | `Türkiye’de Dershaneler` |
| Must include | Type intro; top cities for that type; institution samples; internal links to city×type |
| Index gate | ≥ 1 published institution of that type |

#### L4 — City + type (`/ankara/dershane`)

| Element | Spec |
| --- | --- |
| Purpose | High-value commercial queries |
| H1 example | `Ankara Dershaneleri` |
| Must include | Unique intro; district shortcuts; filtered institution list |
| Index gate | ≥ 1 matching published institution |

#### L5 — District + type (`/ankara/cankaya/dershane`, `/ankara/cankaya/dil-kursu`)

| Element | Spec |
| --- | --- |
| Purpose | Highest local intent (“ilçe + tip”) |
| H1 example | `Çankaya Dershaneleri` / `Çankaya Dil Kursları` |
| Must include | Local intro (not duplicate of city×type); NAP-relevant list; links up to district & city×type |
| Index gate | ≥ 1 matching published institution |
| Note | This is the **core money page** class for MVP |

#### L6 — Institution (see §4)

#### L8 — Search (`/ara`)

| Element | Spec |
| --- | --- |
| Index | Prefer **noindex** when arbitrary filter combos; **canonicalize** to L1–L5 when filters exactly match a hub |
| Rule | If `city+district+type` selected → 302/200 to hub URL or `rel=canonical` to hub |

#### L13 — Future example: `/istanbul/universiteler`

Reserved vertical hub when universities enter catalog. Same rules as L4 conceptually (city + vertical), with its own type taxonomy. **Not MVP.**

### 3.3 MVP type slug map

| InstitutionType | Public slug (examples) |
| --- | --- |
| Private school | `ozel-okul` |
| Course center (dershane) | `dershane` |
| Study center (etüt) | `etut-merkezi` |
| Language school | `dil-kursu` |
| Kindergarten | `anaokulu` |
| Preschool | `kres` |

Slugs are stable; display names remain Turkish natural language in H1s.

---

## 4. Institution pages

### 4.1 Canonical URL

**Canonical pattern:**

```text
/kurum/{institution-slug}
```

**Why not only nested paths?**  
District or type changes must not break equity. Nested URLs may exist as **aliases** that 301 to `/kurum/{slug}`, but the canonical is flat under `/kurum/`.

Examples:

- `/kurum/ankara-ornek-dershane`
- `/kurum/kadikoy-gunes-anaokulu`

### 4.2 Required on-page sections

| Section | Purpose |
| --- | --- |
| **H1 — Institution name** | Primary entity title |
| **Type + location line** | `{Type} · {District}, {City}` |
| **Claimed / Premium badges** | Trust (Premium labeled if paid) |
| **Short description** | Unique parent-facing copy (required to publish) |
| **Programs / offerings summary** | What they teach / age-levels |
| **Contact block (NAP)** | Name, address, phone/email, optional WhatsApp/website |
| **Lead / information request form** | Conversion |
| **Claim CTA** | If unclaimed |
| **Breadcrumbs** | Hierarchy navigation + crawl paths |
| **Related links** | Same district×type, other types in district, city hub |

Optional when data exists: gallery, branch list, map embed (future), teachers, reviews (future), FAQ block.

### 4.3 SEO elements

| Element | Specification |
| --- | --- |
| Title | `{Name} \| {Type} \| {District}, {City} \| EduAtlas` |
| Meta description | Unique; 140–160 chars ideal; from short description |
| H1 | Institution name only (do not stuff) |
| Canonical | `https://{domain}/kurum/{slug}` |
| Robots | `index,follow` when Published; otherwise not publicly served or `noindex` |
| OG/Twitter | title, description, image |
| Slug | Stable; Admin-only change with 301 |
| Content uniqueness | No copy-paste boilerplate across institutions |

### 4.4 Structured content rules

1. Visible text must match schema Organization fields.  
2. Address must include district and city consistently with hub URLs.  
3. Prefer unique 300+ characters of useful description (quality over stuffing).  
4. Do not hide primary content behind tabs that block crawl (if tabs used, content still in HTML).  

### 4.5 Internal links (institution → graph)

Every published institution page **must** link to:

| Target | Example |
| --- | --- |
| City hub | `/ankara` |
| District hub | `/ankara/cankaya` |
| National type | `/dershane` |
| City × type | `/ankara/dershane` |
| District × type | `/ankara/cankaya/dershane` |
| Related institutions | 3–10 peers in same district×type (or city×type fallback) |

No orphan published institution pages.

---

## 5. Program pages

**MVP status:** Optional / future. Domain entity `Program` may exist as on-page summary before dedicated URLs.

### 5.1 Role in SEO

Program pages capture **curriculum and exam intent** that geo×type hubs do not fully own:

| Program theme | Example queries |
| --- | --- |
| LGS | `lgs kursu`, `lgs dershane {ilçe}` |
| YKS | `yks hazırlık`, `ays dershane` |
| English | `ingilizce kursu {ilçe}` |
| German | `almanca kursu` |
| Computer Engineering | future university vertical |
| Medicine | future university vertical |
| MBA | future graduate vertical |

### 5.2 URL patterns (future)

| Type | Pattern | Example |
| --- | --- | --- |
| National program hub | `/program/{program-slug}` | `/program/yks`, `/program/lgs`, `/program/ingilizce` |
| City × program | `/{city}/program/{program-slug}` | `/ankara/program/yks` |
| Institution program | `/kurum/{slug}/program/{program-slug}` | `/kurum/ornek-dershane/program/yks` |

### 5.3 Index gates (future)

- National program hub: ≥ N institutions offering program (threshold TBD, suggested ≥ 5).  
- City × program: ≥ 1 (preferably ≥ 3) in city.  
- Institution program: only if program Published and parent Institution Published; unique copy required.

### 5.4 Until program URLs ship

Use Institution page **Programs / offerings** section + Category tags + blog guides to capture intent without thin URL explosion.

---

## 6. Blog

### 6.1 Purpose

Educational content supports SEO by:

1. Winning **informational queries** that later internally link to money pages (hubs & institutions).  
2. Building topical authority (E-E-A-T) around Türkiye education decisions.  
3. Capturing seasonal demand (kayıt, tercih, burs).  
4. Earning links and brand searches.

Blog is **supporting**, not a substitute for hub architecture.

### 6.2 URL & indexation

| Page | URL | Index |
| --- | --- | --- |
| Blog index | `/blog` | Yes when ≥ 1 published post |
| Post | `/blog/{slug}` | Yes when Published and unique |

### 6.3 Content → hub linking rules

Every post must include contextual links to:

- At least one **district×type** or **city×type** hub where relevant  
- Optionally specific institutions (editorial standards; no paid-only linking abuse)

Example: article “Çankaya’da anaokulu seçerken” → `/ankara/cankaya/anaokulu`.

### 6.4 Quality bar

- Human-edited or human-approved (even if AI-assisted).  
- No mass doorway posts.  
- One primary intent per post.  
- Update seasonal posts yearly rather than duplicating.

---

## 7. Schema.org

Prefer **JSON-LD**. Visible content and schema must agree.

### 7.1 Required / planned types

| Schema | Where | Phase |
| --- | --- | --- |
| `Organization` | Sitewide (publisher) | MVP |
| `WebSite` + `SearchAction` | Home | MVP |
| `EducationalOrganization` (or `School` when accurate) | Institution pages | MVP |
| `BreadcrumbList` | All hubs + institution + blog | MVP |
| `FAQPage` | Hubs/institutions with visible FAQ | MVP optional / encouraged |
| `Article` / `BlogPosting` | Blog posts | When blog ships |
| `Review` + `AggregateRating` | Institution | Future (when reviews launch) |
| `Event` | Open days / webinars | Future |
| `ItemList` | Hub listing pages | Recommended MVP |

### 7.2 Field guidance

#### Organization (site)

- `name`: EduAtlas  
- `url`: canonical site origin  
- `logo`: absolute URL  

#### EducationalOrganization (institution)

- `name`, `url`, `image`  
- `address` as `PostalAddress` (`streetAddress`, `addressLocality`=district/city, `addressRegion`, `addressCountry=TR`)  
- `telephone`, `email` when present  
- `sameAs` for website/social when known  

#### BreadcrumbList

Reflect the public breadcrumb trail exactly.

#### FAQPage

Only if FAQ Q&A are visible on the page. Use for hubs (“Çankaya’da dershane nasıl seçilir?”) sparingly and usefully.

#### Review (future)

Use only for real moderated reviews; never fabricate ratings.

#### Event (future)

Name, startDate, location, organizer, eventStatus.

### 7.3 Validation

- Rich Results eligibility checked on templates before launch.  
- No schema for `noindex` or unpublished entities.

---

## 8. Internal linking strategy

### 8.1 Link graph (normative)

```text
Home
 ├─ National types (L3)
 ├─ Priority cities (L1)
 │    ├─ Districts (L2)
 │    ├─ City × type (L4)
 │    │    └─ District × type (L5)
 │    │         └─ Institutions (L6)
 │    └─ Institutions
 ├─ Blog → hubs
 └─ Static trust pages
```

### 8.2 Rules

| Rule | Detail |
| --- | --- |
| **Downward discovery** | Parent hubs link to child hubs that pass index gates |
| **Upward context** | Every child links to all ancestors in the hierarchy |
| **Lateral peers** | Institution ↔ related institutions; district×type ↔ sibling types in same district |
| **No orphans** | Every published institution linked from ≥ 1 indexable hub |
| **Pagination** | `rel=next/prev` optional; self-canonical per page; page 2+ may stay indexable if unique lists, or canonicalize carefully — prefer index page 1 + crawlable next links |
| **Footer** | Limited set of national types + top cities; not hundreds of links |
| **Anchor text** | Natural Turkish (“Çankaya dershaneleri”), avoid identical spam anchors sitewide |
| **Sponsored** | Paid placements labeled; do not present as organic editorial links |

### 8.3 Crawl budget hygiene

- Do not link to empty hubs from global nav.  
- Soft-prune archived institutions from hub lists.  
- Avoid infinite filter URLs in HTML sitemaps and footer.

### 8.4 Cross-entity linking (future)

Programs, comparisons, and city reports must point back to L4/L5 money pages and representative institutions.

---

## 9. URL structure

### 9.1 Conventions

| Rule | Spec |
| --- | --- |
| Case | **Lowercase** only |
| Encoding | UTF-8; prefer ASCII slugs via Turkish normalization |
| Separators | Hyphen `-` between words |
| Trailing slash | Pick one policy sitewide (recommend **no trailing slash**) and 301 the other |
| HTTPS | Required |
| WWW | Pick apex or `www`; 301 the other |

### 9.2 Turkish slug normalization

| Input | Slug rule |
| --- | --- |
| `ç` | `c` |
| `ğ` | `g` |
| `ı` | `i` |
| `İ` | `i` |
| `ö` | `o` |
| `ş` | `s` |
| `ü` | `u` |
| Spaces / punctuation | `-` |
| Multiple hyphens | collapse |
| Trim | strip leading/trailing `-` |

Examples:

- `Çankaya` → `cankaya`  
- `Dil Kursu` → `dil-kursu`  
- `Etüt Merkezi` → `etut-merkezi`  
- `Özel Okul` → `ozel-okul`

### 9.3 Path grammar (MVP)

```text
/{city}
/{city}/{district}
/{type}
/{city}/{type}
/{city}/{district}/{type}
/kurum/{institution-slug}
/ara                  (search)
/blog/{post-slug}     (when enabled)
/program/{program-slug}  (future)
```

**Disambiguation:**  
If a token could be both a district and a type under a city, resolution order is fixed in routing (districts reserved first under city; type slugs cannot collide with district slugs within the same city). Maintain a reserved-slug registry.

### 9.4 Canonical URLs

| Case | Canonical |
| --- | --- |
| Hub with supply | Self |
| Hub without supply | Do not publish **or** `noindex,follow` (prefer do not publish) |
| Search matching a hub | Hub URL |
| Institution aliases / old slugs | 301 → current `/kurum/{slug}` |
| HTTP / www variants | 301 → HTTPS preferred host |
| Parameter noise (`utm_*`) | Strip for canonical; allow tracking in address bar |

### 9.5 Pagination

| Surface | Pattern | Canonical guidance |
| --- | --- | --- |
| Hub lists | `?sayfa=2` or `/.../sayfa/2` | Prefer query or path consistency sitewide |
| Page 1 | No page param | Self |
| Page 2+ | Indexable if substantial unique list; else `noindex,follow` | Never duplicate page-1 full content |

### 9.6 Sitemap & robots

| Artifact | Rule |
| --- | --- |
| `sitemap.xml` (index) | Split by type when large: cities, hubs, institutions, blog |
| Inclusion | Only Published + `isIndexable=true` |
| `robots.txt` | Allow public SEO; Disallow `/admin`, institution panel, API internals, private previews |
| Hosts | Single preferred host |

---

## 10. Indexing strategy

### 10.1 Index (allow)

| Surface | Condition |
| --- | --- |
| Home, trust pages | Always (when live) |
| City / district / type / city×type / district×type | Supply gate met + unique intro |
| Institution | Published + required fields |
| Blog posts | Published + quality bar |
| Program pages | When shipped + gates met |

### 10.2 Noindex (or do not expose)

| Surface | Rule |
| --- | --- |
| Admin panel | noindex + disallow |
| Institution panel | noindex + disallow |
| Draft / pending / archived / deleted entities | not public or noindex |
| Empty hubs | not generated or noindex |
| Arbitrary search facets | noindex; canonicalize to hub when possible |
| Thank-you / lead confirmation | noindex |
| Internal tag experiments / staging | noindex + auth if possible |
| Thin AI auto-pages without review | noindex until approved |
| Pagination extremes / sort variants | noindex duplicate sorts (`?sirala=`) |

### 10.3 Soft-404 prevention

If a hub falls below supply gate (institutions unpublished):

1. Remove from sitemap  
2. Set `noindex` or 301 to nearest parent hub  
3. Remove from parent link modules  

### 10.4 Indexation ops

- Submit sitemap in Google Search Console.  
- Monitor coverage: indexed vs excluded (thin/duplicate/crawled not indexed).  
- Recrawl priority: new district×type hubs and new institutions in priority cities.

---

## 11. Local SEO

### 11.1 Role of Google Maps / Business Profile

EduAtlas pages **complement** Google Business Profile (GBP); they do not replace it.

| Tactic | Owner |
| --- | --- |
| Encourage claimed institutions to keep GBP accurate | Institution success |
| Match NAP on EduAtlas to real-world / GBP | Claim + admin QA |
| Optional future: embed map on institution page | Product |

EduAtlas does not fabricate map packs; local pack rankings belong to Google. EduAtlas wins **organic web results** for the same intents.

### 11.2 NAP consistency

| Element | Rule |
| --- | --- |
| **N**ame | Official/common name; avoid keyword stuffing in title field |
| **A**ddress | Street + district + city; consistent with `City`/`District` entities |
| **P**hone | Single primary display phone; same in schema |

Inconsistencies between Institution fields and schema are defects.

### 11.3 City relevance

- City hubs and city×type pages use city-specific copy and institution sets.  
- Avoid identical blurbs across all cities (“Lorem eğitim şehri…”).  
- Priority cities may receive editorial intros first.

### 11.4 District relevance

- District×type pages are the local relevance engine.  
- Mentions of landmarks/neighborhoods allowed when accurate and useful.  
- Internal links between neighboring districts: optional, moderated (avoid spammy meshes).

### 11.5 Geotargeting

- Single country site focused on Türkiye; no hreflang needed for MVP.  
- Do not create doorway pages for non-served cities.

---

## 12. Content strategy

### 12.1 Evergreen content

| Type | Examples | Links to |
| --- | --- | --- |
| Hub intros | How to choose anaokulu / dershane | L4/L5 |
| Institution descriptions | Unique profiles | Lead form |
| Guides | “Özel okul seçim kriterleri” | Types + cities |
| Glossary | Education terms | Relevant hubs |

### 12.2 Seasonal content

| Season | Themes |
| --- | --- |
| Spring–summer | Okul kayıt, anaokulu/kreş arayışı |
| Pre-academic year | Dershane / etüt yoğunluğu |
| Exam calendar | LGS, YKS peaks |
| Language exam periods | IELTS/TOEFL etc. (language schools) |

Update titles/intros and internal links; avoid spawning duplicate seasonal URLs each year when one evergreen URL can be refreshed.

### 12.3 Topic pillars

| Pillar | Example titles | Conversion path |
| --- | --- | --- |
| **LGS** | LGS kursu nasıl seçilir? | → `/program/lgs` (future) → city hubs → institutions |
| **YKS** | YKS dershane seçim rehberi | → dershane hubs |
| **University preferences** | Tercih dönemi kontrol listesi | Future university vertical |
| **Scholarships** | Burs olanakları rehberi | Future Scholarship entity + editorial |
| **Preschool choice** | Anaokulu gezerken sorulacaklar | → anaokulu district hubs |
| **Language learning** | Dil kursu seviyeleri | → `dil-kursu` hubs |

### 12.4 Content ownership

| Content | Owner |
| --- | --- |
| Hub boilerplate templates | Product + SEO |
| Priority hub unique intros | Editorial / Admin |
| Institution copy | Admin seed → InstitutionOwner |
| Blog | Editorial |
| AI drafts | Allowed only with human approval flag (`aiGenerated` + review) |

---

## 13. Success metrics

### 13.1 Primary SEO KPIs

| Metric | Definition | Why |
| --- | --- | --- |
| **Indexed pages** | Indexable URLs actually indexed (Search Console) | Scale + health |
| **Organic traffic** | Sessions / users from organic search | Acquisition |
| **CTR** | Search Console average CTR for EduAtlas queries | Snippet quality |
| **Ranking** | Positions for priority templates (`{ilçe} {tip}`, brand) | Competitiveness |
| **Institution page impressions** | SC impressions + on-site views for `/kurum/*` | Supply value |

### 13.2 Supporting metrics

| Metric | Notes |
| --- | --- |
| Index coverage ratio | Indexed / submitted |
| Hub landing → institution CTR | Internal conversion |
| Institution → lead rate | Business outcome of SEO |
| Query mix | Brand vs non-brand |
| Core Web Vitals | Mobile UX affecting rank |
| Orphan rate | Published institutions with zero hub inlinks |

### 13.3 Priority query classes (track explicitly)

1. `{district} {type}` — e.g., `kadıköy anaokulu`, `çankaya dershane`  
2. `{city} {type}` — e.g., `ankara dil kursu`  
3. Institution brand names  
4. Informational guides (blog)  
5. Future: `{program}` and `{city} {program}`

### 13.4 Targets (directional)

Align with PRD Phase 0: majority of launch indexables submitted; organic sessions growing week-over-week after indexation; institution impressions rising with published count.

Exact numeric SEO OKRs set in Release Planning.

---

## 14. Technical SEO requirements (architecture-level)

| Area | Requirement |
| --- | --- |
| Rendering | Public SEO pages must expose primary content to crawlers (SSR/SSG or equivalent) |
| Performance | Mobile-first; avoid blocking LCP with heavy client-only content |
| Status codes | 200 indexables; 301 moves; clean 404; no soft-404 200s for empty |
| Duplicates | One canonical per institution; hubs not duplicated under `/ara` |
| Security | HTTPS sitewide |
| International | Turkish MVP only; hreflang later if multi-locale |

---

## 15. Future extensions

### 15.1 AI-generated landing pages

| Rule | Detail |
| --- | --- |
| Allowed | Draft intros for hubs/programs with `aiGenerated=true` |
| Not allowed | Mass index without human review |
| Gate | Admin approve → `isIndexable=true` |
| Quality | Unique facts, no hallucinated phone/address |

### 15.2 Program-specific hubs

National and city program hubs (`/program/yks`, `/istanbul/program/ingilizce`) as described in §5.

### 15.3 City reports

`/rapor/ankara` style pages: data narratives (counts by type, district density). Useful for PR/links; index only if substantial unique analysis.

### 15.4 Institution comparisons

Parent-facing comparison URLs must:

- Use real structured fields  
- Avoid thin auto-pages for every pair (combinatorial explosion)  
- Prefer on-demand compare with `noindex` **or** curated comparison articles  

### 15.5 Additional verticals

Examples: `/istanbul/universiteler`, health schools, sports academies — new type slugs + same hierarchy rules.

### 15.6 Reviews & events schema

Activate `Review` and `Event` only with product features; never schema-only.

---

## 16. Governance

| Decision | Owner |
| --- | --- |
| New page type / URL pattern | Product + SEO architecture update |
| Slug changes | Admin + mandatory 301 |
| Indexation exceptions | SEO owner documented in Search Console notes |
| Paid placement vs organic | Business rules; labels mandatory |

**Conflict rule:** If implementation convenience conflicts with this architecture, **this document wins** until a versioned revision is approved.

---

## 17. MVP launch checklist (SEO)

- [ ] URL grammar live for L0–L6  
- [ ] Supply gates enforced (no empty indexables)  
- [ ] Institution canonical `/kurum/{slug}` with breadcrumbs into hierarchy  
- [ ] Internal links: ancestors + related peers  
- [ ] JSON-LD: Organization, WebSite, EducationalOrganization, BreadcrumbList  
- [ ] Sitemap contains only indexables; robots blocks private areas  
- [ ] Search Console property + sitemap submitted  
- [ ] Title/meta templates verified on samples across types/cities  
- [ ] NAP consistency spot-check on priority institutions  

---

## 18. Approval

| Role | Name | Date | Sign-off |
| --- | --- | --- | --- |
| Product | | | ☐ |
| SEO / Growth | | | ☐ |
| Engineering | | | ☐ |

**Summary:** EduAtlas scales SEO through a **Türkiye → city → district → type → institution (→ program)** hierarchy, indexes only supply-backed pages, keeps **stable `/kurum/{slug}` canonicals**, and uses content, schema, and internal links to become the country’s largest education discovery surface via organic search.
