# EduAtlas — Search Architecture

| Field | Value |
| --- | --- |
| **Product** | EduAtlas |
| **Document** | SEARCH-ARCHITECTURE.md |
| **Version** | 1.0 |
| **Sprint** | Sprint-003 — Search Foundation |
| **Task** | Task-001 |
| **Status** | Binding permanent search architecture |
| **Market** | Türkiye |
| **Primary locale** | Turkish (`tr-TR`) |
| **Last updated** | 14 July 2026 |

---

## Document control

This document defines the **long-term search architecture** for EduAtlas. It is the permanent contract for how parents, students, and (later) institutions discover education entities through keyword, geography, type, autocomplete, ranking, and related discovery surfaces.

Search must scale from launch seed data to **hundreds of thousands of institutions** and **millions of monthly search sessions** without collapsing into unranked noise, thin SEO duplicates, or unbounded filter indexation.

| Related document | Role |
| --- | --- |
| `PRD.md` | MVP search requirements & acceptance |
| `DOMAIN-MODEL.md` | Institution, City, District, InstitutionType, SearchQuery |
| `SEO-ARCHITECTURE.md` | Hub intent, index gates, search ↔ SEO boundary |
| `URL-STRATEGY.md` | `/search` query policy, hub canonicals, pagination params |
| `ROUTES.md` | App Router paths for search & hubs |
| `SYSTEM-ARCHITECTURE.md` | Search module, provider port, phased engines |
| `FIREBASE-ARCHITECTURE.md` | Firestore fallback, index sync, outbox |
| `BUSINESS-MODEL.md` | Featured / premium placement & disclosure |
| `UI-ARCHITECTURE.md` | Search UX shells, empty/error states |
| `NAVIGATION.md` | Entry points into search |

**Authority stack for discovery**

1. **SEARCH-ARCHITECTURE.md** — ranking, filters, engines, journeys, zero-result, AI future  
2. **SEO-ARCHITECTURE.md** — when a discovery URL may be indexed  
3. **URL-STRATEGY.md** — canonical URL form for hubs vs `/search`  
4. **PRD.md** — product scope for a given phase  

**Non-goals of this document:** Implementation code, vendor SDK snippets, UI chrome, analytics dashboards, or sitemap/robots generation.

---

## 1. Goals

| Goal | Description |
| --- | --- |
| **Intent resolution** | Turn parent intent (place + type + name/keyword) into a short, trustworthy result set. |
| **Local-first discovery** | Prefer district and city relevance over national brand dominance when intent is local. |
| **SEO coexistence** | Search UI must reinforce hub pages, never compete with or duplicate indexable hubs. |
| **Trust-preserving ranking** | Verified / claimed quality signals may help; paid placement must be labeled and separable from organic relevance. |
| **Turkish-first matching** | Correct handling of Turkish orthography, common misspellings, and education synonyms. |
| **Shareable state** | Every meaningful search state is expressible in URL query params (`URL-STRATEGY.md`). |
| **Engine pluggability** | Presentation and application contracts stay stable while Firestore → external search engines evolve. |
| **Privacy-safe learning** | Capture `SearchQuery` analytics without storing unnecessary PII. |
| **Long-term scale** | Architecture holds at 100k+ institutions and high QPS without full-collection scans. |

### 1.1 Non-negotiable rules

1. **Published-only** in public search. Draft / unpublished / archived / deleted never appear.  
2. **One primary type per institution (MVP)** for filtering and ranking type facets.  
3. **District filter requires city context** (or city-scoped page context).  
4. **Hubs own SEO intent**; `/search` is the interactive filter surface and is generally `noindex`.  
5. **Paid ≠ organic** — featured / premium boosts are disclosed and must not silently rewrite organic relevance forever.  
6. **Deterministic eligibility** — search never invents institutions that fail publish gates.

---

## 2. Search philosophy

EduAtlas search is **directory discovery**, not a general web search engine and not a marketplace auction by default.

### 2.1 Principles

| Principle | Meaning |
| --- | --- |
| **Narrow before browse** | Geography and type are first-class; free text refines within a sensible scope. |
| **Name is sacred** | Exact / near-exact institution name matches outrank weak keyword hits. |
| **Place is intent** | “Kadıköy anaokulu” is a place+type intent, not a keyword soup. |
| **Completeness earns visibility** | Richer, accurate profiles may rank above thin stubs when relevance is otherwise similar. |
| **Transparency over dark patterns** | Sponsored rows are labeled; filters never hide that paid slots exist. |
| **Fail helpful** | Zero results always offer a recovery path (broaden filters, hubs, popular queries). |
| **Latency over perfection** | Prefer fast, good-enough ranking with clear pagination over slow “perfect” scoring. |

### 2.2 What search is for

- Finding a **known institution by name**  
- Listing **all published entities of a type in a place**  
- Exploring when the parent has **partial intent** (city only, type only, typo’d name)  
- Bridging from **hub SEO landings** into deeper filter refinement  

### 2.3 What search is not for (MVP)

- Full-text blog/article search as primary results  
- Map-first “nearby radius” as the only discovery mode  
- Personalized “for you” feeds that replace explicit filters  
- AI chat that replaces structured filters without auditability  

---

## 3. Parent search journey

Primary demand-side journey.

```text
Entry (home / hub / header / organic)
  → Intent capture (q + city + district + type)
  → Autocomplete (optional early select)
  → Results (/search or redirected hub)
  → Refine (filters / sort / page)
  → Institution profile
  → Lead / contact
```

### 3.1 Entry points

| Entry | Typical intent |
| --- | --- |
| Home hero search | National or lightly scoped discovery |
| Header search | Global jump from any page |
| City / district / type hub CTA | Already geo/type-scoped; search refines |
| Organic hub landing | SEO intent already resolved; search is secondary refinement |
| 404 / empty recovery | Re-entry with suggestions |

### 3.2 Success criteria (parent)

- Can find a known institution by approximate name within 1–2 queries  
- Can list kindergartens (or other type) in a chosen district  
- Understands active filters and can clear them  
- Can open a profile and request information without losing orientation  

### 3.3 Session model

- Search state lives in the **URL** (shareable, crawl-aware).  
- Optional client **recent searches** (device-local) — see §17.  
- Server may log anonymized `SearchQuery` events — see Domain Model.

---

## 4. Institution search journey

Finding a **specific institution** (known-item search).

### 4.1 Signals

| Signal | Weight guidance |
| --- | --- |
| Exact name match (folded) | Highest |
| Prefix / autocomplete select | Very high |
| Token overlap on name | High |
| Summary / programs / tags | Medium |
| City/district agreement with filters | Required when filters set; boost when inferred from query |
| Claimed / verified | Soft quality boost (never invents match) |
| Completeness / quality score | Soft tie-breaker |

### 4.2 Behaviors

1. If `q` strongly matches one institution → show it first; optionally surface “En iyi eşleşme”.  
2. If `q` matches a type synonym (“anaokulu”, “kreş”) with no name hit → treat as **type intent**, apply type filter suggestion.  
3. If `q` matches a city/district name → suggest scoping geography rather than keyword-only.  
4. Unpublished never appear even if name matches.

### 4.3 Institution self-find (owner journey, secondary)

Owners may search for their listing to claim it. Same public index; claim CTAs appear on profile, not as a separate search mode in MVP.

---

## 5. City search

### 5.1 Modes

| Mode | Behavior |
| --- | --- |
| **Filter** | `city={city-slug}` scopes institution results |
| **Browse / hub** | `/cities/{city}` is the SEO canonical for “institutions in city” |
| **Autocomplete** | City entities appear as suggestion type `city` |

### 5.2 Rules

- City options in filters: prefer cities with ≥1 published institution; static full list allowed if empty states are clear.  
- Selecting a city alone with empty `q` and no type **should prefer navigating or canonicalizing to the city hub** when that matches hub intent (`SEO-ARCHITECTURE.md`).  
- City slug is the public identifier in URLs (`URL-STRATEGY.md`).

### 5.3 Ranking within a city

When filters are city-scoped and `q` is empty:

- Default sort = relevance placeholder based on quality + featured slots + name  
- Optional A–Z name sort  

---

## 6. District search

### 6.1 Modes

| Mode | Behavior |
| --- | --- |
| **Filter** | `district={district-slug}` with required `city` |
| **Browse / hub** | `/cities/{city}/{district}` owns local SEO intent |
| **Autocomplete** | District suggestions require or imply parent city |

### 6.2 Rules

1. District without city is **invalid** for filter application — UI prompts city first or infers city when unambiguous.  
2. District list = districts of selected city that have published supply **or** full static list with honest empty states (product must pick one consistently).  
3. Query phrases like “Çankaya dershane” should suggest city=Ankara + district=Çankaya + type=dershane.

### 6.3 Local intent priority

District-scoped results must not be flooded by same-city institutions outside the district unless the user clears the district filter.

---

## 7. Category / type search

MVP uses **InstitutionType** (six launch verticals). “Category” in product language maps to these types and future category taxonomy.

### 7.1 MVP types

1. Özel okul (private school)  
2. Dershane (course center)  
3. Etüt merkezi (study center)  
4. Dil okulu (language school)  
5. Anaokulu (kindergarten)  
6. Kreş / okul öncesi (preschool)

### 7.2 Modes

| Mode | Behavior |
| --- | --- |
| **Filter** | `type={type-slug}` (single-select minimum; multi-select optional later) |
| **National type hub** | Category / institution-type landing owns national type SEO |
| **City × type / district × type hubs** | Own local type SEO |
| **Autocomplete** | Suggestion type `type` / `category` |

### 7.3 Synonym → type mapping

Free-text synonyms resolve to controlled `type` (see §14). Example: “ana okulu”, “kindergarten” (future locale), “kreş” → appropriate type codes.

### 7.4 Multi-type institutions

MVP: one `primaryTypeId`. Secondary types are future; search must not invent multi-type facets until domain supports them.

---

## 8. University search (future)

**Status:** Reserved. Not MVP.

### 8.1 Future intent

Parents/students will search universities, faculties, and programs with different ranking and filters (exam scores, language of instruction, public/private, city).

### 8.2 Architectural reservation

| Concern | Direction |
| --- | --- |
| Entity | Distinct `University` / program model or InstitutionType expansion — decide in a domain revision |
| Index | Separate index or filtered partition `vertical=university` |
| Hubs | City × university vertical hubs (see SEO L13 reservation) |
| Ranking | Different completeness and trust signals than K–12 / course centers |
| Filters | Exam track, degree level, language, campus — not forced into MVP filter keys |

### 8.3 Constraint

Do **not** overload MVP `type` slugs or `/search` contracts with university-only params until this section is activated by PRD revision.

---

## 9. Autocomplete

### 9.1 Purpose

Reduce typing, correct intent early, and route users to the right entity or hub.

### 9.2 Suggestion types (ordered presentation)

| Kind | Example | On select |
| --- | --- | --- |
| `institution` | “Örnek Anaokulu” | Go to `/institutions/{slug}` **or** run name search |
| `city` | “İstanbul” | Scope `city` or go to city hub |
| `district` | “Kadıköy” (with city) | Scope city+district or district hub |
| `type` | “Anaokulu” | Scope `type` or type hub |
| `query` | “kadıköy anaokulu” | Run as `q` (+ inferred filters if parsed) |
| `popular` | Curated popular searches | Run preset query/filters |

### 9.3 Behavior rules

1. Debounced input (target ≤ 200–300ms after pause).  
2. Minimum characters: typically 2 (Turkish-aware).  
3. Published institutions only in `institution` suggestions.  
4. Keyboard operable: ↑/↓, Enter, Escape; ARIA combobox pattern.  
5. Empty autocomplete ≠ error; show popular / recent when query empty and field focused (optional).  
6. Autocomplete API is **read-only**, rate-limited, cacheable.

### 9.4 Ranking inside autocomplete

1. Exact prefix on institution name  
2. Folded fuzzy / typo-tolerant name  
3. Geo and type dictionary matches  
4. Popularity (search volume / clicks) as soft boost  

### 9.5 Privacy

Do not echo PII-looking strings as “suggestions.” Scrub phone/email-like inputs from logged autocomplete analytics.

---

## 10. Ranking

### 10.1 Layers

```text
1. Eligibility (published, geo/type filters)
2. Hard constraints (district ⊆ city, type match)
3. Text relevance (name > tokens > body)
4. Quality signals (completeness, claimed/verified)
5. Business slots (featured / premium) — labeled, capped
6. Deterministic tie-break (slug or id) for stable pagination
```

### 10.2 Organic relevance (conceptual)

| Factor | Notes |
| --- | --- |
| Name match score | Exact > prefix > fuzzy > token |
| Field weights | name ≫ summary > programs/tags > address |
| Geo agreement | Query-inferred or filter-aligned place boosts |
| Type agreement | Synonym/type match boosts |
| QualityScore | Profile completeness / freshness from domain/ops |
| Claimed / verified | Modest boost; never overrides strong name mismatch |
| Engagement (future) | CTR with careful damping; avoid popularity death spiral |

### 10.3 Stability

- Same query + filters + sort + page → **stable ordering** within an index generation.  
- Tie-break on opaque stable id to avoid shuffle across pages.

### 10.4 What must not dominate organic rank

- Raw paid bid without disclosure  
- Recency alone  
- Owner self-boost flags outside featured product  
- Fake reviews (reviews are future and moderated)

---

## 11. Featured institutions

### 11.1 Definition

**Featured** = time-boxed or campaign-based **spotlight placement** on search results and/or hubs, sold or granted per `BUSINESS-MODEL.md`.

### 11.2 Placement rules

| Rule | Spec |
| --- | --- |
| Label | Visible “Öne çıkan” / “Sponsorlu” (product copy TBD) |
| Cap | Max N featured per result page / hub section (recommend 1–3) |
| Eligibility | Must still match active filters and be Published |
| Separation | Featured block **above** or **interleaved with clear labeling** — never silent |
| Analytics | Track impressions/clicks separately from organic |
| SEO | Featured on hubs must not create thin duplicate URLs |

### 11.3 Ranking interaction

Featured affects **presentation slots**, not the definition of organic relevance score. Organic list remains explainable without featured.

---

## 12. Premium institutions

### 12.1 Definition

**Premium** = subscription / membership tier unlocking benefits (inbox tools, limits, optional credits). Distinct from a single featured campaign.

### 12.2 Search impact (allowed)

| Allowed | Not allowed |
| --- | --- |
| Modest organic tie-break among near-equal relevance | Buying #1 for unrelated queries |
| Eligibility for featured inventory | Hiding competitors via paywall |
| Badge on cards (“Premium”) if truthful | Fake verification badges |

### 12.3 MVP note

Premium may exist as a domain flag before monetization is live. Search must tolerate `isPremium` without requiring payment systems in early sprints.

---

## 13. Verified institutions

### 13.1 Definition

**Verified** ≈ claim approved / ownership verified (and any future stronger KYC). Distinct from Premium.

### 13.2 Search impact

| Signal | Use |
| --- | --- |
| Claimed / verified badge | Trust on cards & autocomplete |
| Soft rank boost | Small; secondary to name/geo/type match |
| Lead routing | May affect post-click conversion, not eligibility |

### 13.3 Rules

- Unclaimed institutions remain searchable if Published.  
- Verification never fabricates ratings.  
- Admin can revoke verification → badge and boost drop on next index sync.

---

## 14. Spelling tolerance

### 14.1 Turkish folding (required direction)

Normalize for matching (not necessarily for display):

| Concern | Example |
| --- | --- |
| Case | `İ`/`I`/`i`/`ı` folding policy must be explicit and tested |
| Diacritics | `ş→s`, `ğ→g`, `ü→u`, `ö→o`, `ç→c` for fallback matching |
| Spacing / punctuation | “ana okulu” ≈ “anaokulu” |
| Latin digraphs | Optional later (`sh`≈`ş`) — lower priority |

### 14.2 Typo tolerance

| Phase | Capability |
| --- | --- |
| MVP Firestore | Prefix / token equality on `nameFolded` + `searchKeywords[]`; limited edit distance |
| External engine | Built-in typo tolerance (1–2 edits), tuned for Turkish |

### 14.3 Did-you-mean

When result confidence is low or count is 0:

- Suggest corrected query / city / type  
- One primary suggestion preferred over long lists  

---

## 15. Synonyms

### 15.1 Controlled synonym lists

Maintain admin-editable synonym maps (config or collection), versioned:

| Class | Examples |
| --- | --- |
| Type synonyms | kreş ↔ anaokulu (careful: may be distinct types — map deliberately) |
| Brand aliases | common short names → institution id (careful, abuse-prone) |
| Place aliases | “Ist” / “İstanbul”; “Ankara Çankaya” |
| Education jargon | YKS, LGS, IELTS → tags/programs (future) |

### 15.2 Rules

1. Synonyms expand **query understanding**, not index spam.  
2. Type synonyms should set/suggest `type` filter rather than only OR-expand tokens when intent is clear.  
3. Brand aliases require Admin governance to prevent hijacking.  
4. Locale: Turkish primary; English synonyms only when multi-locale ships.

---

## 16. Filters

### 16.1 MVP filter set

| Key | Meaning | Dependency |
| --- | --- | --- |
| `q` | Free-text keyword | — |
| `city` | City slug | — |
| `district` | District slug | Requires `city` |
| `type` | Institution type slug | — |

Aligned with `URL-STRATEGY.md` allowed keys.

### 16.2 Filter UX rules

- Filters are additive (AND).  
- Clearing city clears district.  
- Changing city resets incompatible district.  
- Empty `q` + filters still returns listings (browse mode).  
- Filter chips reflect active state and are keyboard accessible.

### 16.3 Future filters (reserved)

`program`, `age`, `language`, `priceBand`, `verifiedOnly`, `openDay`, `near` (geo), `university*` — do not implement until PRD activates.

### 16.4 Multi-select types

Optional post-MVP: `type=a,b` or repeated keys. Prefer single-select until UX and SEO implications are decided.

---

## 17. Sorting

### 17.1 MVP sorts

| `sort` value | Behavior |
| --- | --- |
| `relevance` (default) | Ranking stack in §10 |
| `name` | A→Z by localized name |

### 17.2 Rules

- `sort` never enters SEO canonicals (`URL-STRATEGY.md`).  
- Unknown `sort` → default `relevance`.  
- Featured slots may remain pinned/labeled regardless of name sort **or** hide featured when user explicitly sorts by name — pick one product rule and keep consistent (recommend: keep labeled featured only on relevance).

### 17.3 Future sorts

Distance, rating, newest — only with real data and disclosure.

---

## 18. Pagination

### 18.1 Contract

| Item | Spec |
| --- | --- |
| Param | `page` (1-indexed) |
| Page size | Fixed server-side page size (recommend 12 or 24; product locks one) |
| Page 1 URL | Omit `page` or normalize `page=1` away |
| Deep pages | Allowed but may be soft-capped (e.g. max page 50) for abuse/cost |
| Stability | Cursor or offset with deterministic tie-break; document chosen approach per engine |

### 18.2 UX

- Clear “showing X–Y of Z” when total is known  
- If total is approximate (external engine), say so in UI copy later  
- Prefetch next page optional; must not hammer Firestore  

### 18.3 SEO

`/search` pagination remains `noindex`. Hub pagination follows SEO/URL strategy, not this search surface.

---

## 19. Zero-result strategy

Never dead-end.

### 19.1 Response content

When `resultCount = 0`:

1. Honest empty message (“Bu filtrelerle kurum bulunamadı”)  
2. **Broaden** actions: clear district → clear type → clear city → clear `q`  
3. **Did-you-mean** if spelling/synonym alternative exists  
4. Links to relevant **hubs** (city, type, home)  
5. **Popular searches** / featured discovery chips  
6. Optional: show nearest alternate district/type counts (“İstanbul’da 128 anaokulu”) without faking matches in the empty list  

### 19.2 Logging

Log zero-result `SearchQuery` events for ops and synonym tuning. High zero-rate queries become backlog for data acquisition and synonym work.

### 19.3 Forbidden

- Injecting unrelated national brands as if they matched  
- Silent removal of filters without telling the user  

---

## 20. Search suggestions

Broader than autocomplete dropdown — includes on-page suggestion modules.

| Surface | Content |
| --- | --- |
| Autocomplete panel | §9 |
| Empty state | §19 |
| Results sidebar / below | Related types, sibling districts, “people also search” |
| Home | Popular cities / types (already product pattern) |

Suggestions must be **supply-aware** where possible (don’t push empty hubs).

---

## 21. Recent searches

### 21.1 MVP approach

- **Client-local** (localStorage / similar): last N queries (recommend 5–10)  
- Shown when search input focused and `q` empty  
- User can clear all  

### 21.2 Rules

- Do not sync recent searches to server in MVP (privacy + scope)  
- Do not store if query looks like PII  
- Not used for ranking personalization in MVP  

### 21.3 Future

Authenticated parent accounts may sync saved searches — requires PRD + privacy review.

---

## 22. Popular searches

### 22.1 Sources

| Source | Use |
| --- | --- |
| Curated editorial list | Launch-safe, supply-backed |
| Aggregated anonymized SearchQuery | Post-launch tuning |
| Hub popularity | Cities/types with strong supply |

### 22.2 Rules

- Prefer queries that resolve to healthy result sets  
- Exclude spam, offensive, or PII-like strings  
- Refresh periodically; cache aggressively  
- Popular ≠ paid; paid campaigns use Featured (§11)

---

## 23. SEO interaction

Search and SEO are partners with a hard boundary.

### 23.1 Ownership

| Intent | Owner URL |
| --- | --- |
| City discovery | `/cities/{city}` |
| District discovery | `/cities/{city}/{district}` |
| Type / category | Category or institution-type hubs |
| City×type / district×type | Hub routes per SEO/URL docs |
| Institution entity | `/institutions/{slug}` |
| Arbitrary filter UI | `/search?…` |

### 23.2 Rules

1. `/search` default robots: **`noindex,follow`** for arbitrary combos.  
2. When filters **exactly** equal a hub → **navigate or canonicalize to hub** (prefer navigation).  
3. Autocomplete selecting an institution → prefer **profile URL**, not a perpetual search URL.  
4. Do not generate indexable URLs for every filter permutation.  
5. Internal links from results should strengthen hubs (city, district, type chips).  
6. JSON-LD SearchAction on site (placeholder OK early) must point at a stable search URL template without promising indexed facet URLs.

### 23.3 Crawl budget hygiene

Search result HTML should not create soft-404 patterns; empty search pages stay noindex and offer recovery links.

---

## 24. Caching

### 24.1 Layers

| Layer | What | TTL guidance |
| --- | --- | --- |
| CDN / edge | Public hub pages (SEO) | Long; purge on publish |
| HTTP cache | Autocomplete popular / empty-q suggestions | Short–medium |
| App cache | Normalized city/district/type dictionaries | Medium; versioned |
| Search engine | External index replicas | Vendor-managed |
| Negative cache | Zero-result popular misspellings → did-you-mean | Short |
| Browser | Recent searches only (local) | N/A |

### 24.2 Cache keys

Include: normalized `q`, `city`, `district`, `type`, `sort`, `page`, index generation / schema version.

### 24.3 Invalidation

Institution publish / unpublish / rename / geo/type change → search outbox job updates index → caches keyed by generation eventually consistent (target §25).

### 24.4 Forbidden

Caching personalized ranking that leaks user A’s results to user B. MVP ranking is global, so shared caching is OK.

---

## 25. Performance targets

Targets are architectural SLOs — tune per environment but do not silently abandon.

| Metric | Target (p95, public) |
| --- | --- |
| Autocomplete suggest | ≤ 150–250 ms server time |
| Search results first page | ≤ 400–600 ms server time (external engine); Firestore MVP may be higher but paginated & indexed |
| Time to first meaningful results paint | ≤ 1.5–2.5 s on mid mobile (app + network) |
| Index update lag (publish → searchable) | ≤ 1–5 minutes typical; eventually consistent |
| Availability | Search read path independent enough that hub SSR can degrade gracefully |

### 25.1 Cost controls

- Hard page size and max page  
- Rate limits on autocomplete & search APIs  
- No unbounded `OR` fan-out on Firestore MVP  
- Projection: return **cards**, not full profiles, in list responses  

### 25.2 Degradation

If external search is down → fallback provider (Firestore filtered browse / degraded keyword) with UI note if quality drops materially.

---

## 26. Firebase architecture

Aligns with `FIREBASE-ARCHITECTURE.md` and `SYSTEM-ARCHITECTURE.md`.

### 26.1 Phased engines

| Phase | Engine | Role |
| --- | --- | --- |
| **MVP** | Firestore fallback | Filters on `cityId` / `districtId` / `primaryTypeId` + `nameFolded` / `searchKeywords[]` |
| **Near-term** | Meilisearch **or** Algolia **or** Typesense | Full-text Turkish, typos, facets |
| **Optional hybrid** | FS filters + external text | Transitional |

### 26.2 System of record

**Firestore** remains source of truth for Institution documents. Search indexes are **projections**.

### 26.3 Projection document (`institutions_public` logical)

Include at least:

- `id`, `slug`, `name`, `nameFolded`  
- `primaryTypeId` / type slug  
- `cityId` / city slug / names  
- `districtId` / district slug / names  
- `claimStatus` / verified flags  
- `isPremium`, `featured` campaign refs (if active)  
- `qualityScore`, `updatedAt`  
- Optional `geohash`, program tags  

**Never index:** lead PII, claim documents, admin notes, unpublished drafts.

### 26.4 Sync path

```text
Institution write (Firestore)
  → onInstitutionWrite Function
  → searchIndexJobs outbox
  → indexer worker (retry / DLQ)
  → external index upsert/delete
```

Unpublish → delete-or-filter from public index immediately in logical terms.

### 26.5 API boundary

```text
UI → Server Action / Route Handler → Application Search use case → SearchProvider port
      → FirestoreSearchAdapter | ExternalSearchAdapter
```

Clients do not hold admin search keys. Search-only keys only if strictly scoped and rate-limited; prefer server-mediated search for MVP consistency with SEO and logging.

### 26.6 Analytics

Create `SearchQuery` records (or analytics pipeline equivalent) with:

`occurredAt`, `rawQuery` (scrubbed), `normalizedQuery`, filters, `resultCount`, `sessionId` (non-PII), optional clicked institution id.

Retention job archives/deletes per privacy policy.

### 26.7 Security

- Public search returns only published projections  
- Abuse: App Check / IP rate limits on search endpoints  
- Admin synonym/featured config is Admin-authenticated only  

---

## 27. Future AI search

**Status:** Future. Not required for MVP launch criteria.

### 27.1 Allowed directions

| Capability | Description |
| --- | --- |
| Query understanding | NL → structured filters (`city`, `district`, `type`, constraints) |
| Ranking assist | Re-rank within eligible set with explainable features |
| Semantic recall | Embedding retrieval for synonyms/paraphrase — always intersected with hard filters |
| Assistive copy | “Why these results” explanations |
| Ops tools | Cluster zero-result queries for data gaps |

### 27.2 Guardrails

1. AI never bypasses Published / filter eligibility.  
2. AI never invents institutions or contact data.  
3. Paid placement rules still apply and remain labeled.  
4. Outputs must be evaluable (gold query sets, regression).  
5. Cost/latency budgets enforced; AI path is optional enhancement, not single point of failure.  
6. Privacy: no raw lead PII in prompts; minimize session content sent to model providers.

### 27.3 Architecture sketch

```text
Query → (optional) LLM/parser → Structured SearchRequest
     → SearchProvider (lexical/semantic hybrid)
     → Eligible set → Ranker → Cards
```

Keep `SearchRequest` as the stable application DTO so AI is a preprocessor, not a parallel product.

---

## 28. Out of scope

Explicitly out of scope for this architecture document and for MVP search unless a future PRD revision says otherwise:

- Implementation code, schemas-as-migrations, or vendor lock-in commits beyond ports  
- Reviews / star ratings as rank input  
- Map-first discovery as the primary search UI  
- Saved searches synced to accounts  
- Comparison matrix search  
- University vertical (reserved in §8)  
- Multi-country / multi-locale search  
- Voice search  
- Autocomplete over blog posts as primary results  
- Personalization that changes global organic order per user in MVP  
- Selling unlabeled rank  
- Indexing unpublished or private owner data  
- Replacing SEO hubs with infinite `/search` landing pages  

---

## 29. Acceptance criteria (specification)

This document is accepted when:

- [ ] Goals and philosophy are agreed as permanent search north stars  
- [ ] Parent and institution journeys are clear and aligned with PRD J-paths  
- [ ] City, district, category/type, and future university boundaries are specified  
- [ ] Autocomplete, ranking, featured, premium, and verified behaviors are unambiguous  
- [ ] Spelling tolerance and synonyms strategy is defined for Turkish  
- [ ] Filters, sorting, pagination match URL/SEO contracts  
- [ ] Zero-result, suggestions, recent, and popular behaviors are specified  
- [ ] SEO interaction rules prevent hub duplication  
- [ ] Caching, performance targets, and Firebase phased engines are documented  
- [ ] Future AI search is reserved with guardrails  
- [ ] Out of scope is explicit  

**No implementation is required for Task-001 acceptance.**

---

## 30. Approval

| Role | Name | Date | Sign-off |
| --- | --- | --- | --- |
| Product | | | ☐ |
| Engineering | | | ☐ |
| SEO | | | ☐ |
| Design / UX | | | ☐ |
| Data / Privacy | | | ☐ |

**Summary:** EduAtlas search is a **Turkish-first, local-intent directory engine** that resolves parent queries through **filters + keyword + autocomplete**, ranks with **name/geo/type relevance and trust signals**, isolates **labeled featured/premium** from organic integrity, degrades helpfully on **zero results**, and stays pluggable from **Firestore → external search → optional AI query understanding**—always subordinate to **SEO hub canonicals** and built to scale to **100k+ institutions**.
