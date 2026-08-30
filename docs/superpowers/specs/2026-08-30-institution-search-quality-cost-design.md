# PRD — Institution Search Quality + Cost

| Field | Value |
| --- | --- |
| **Product** | EduAtlas |
| **Document** | Institution search quality and Firestore cost |
| **Date** | 2026-08-30 |
| **Status** | Spec only — not implemented |
| **Related** | `SEARCH-ARCHITECTURE.md`, search engine audit (2026-08-30) |

**Authority:** This spec overrides in-memory city-dump free-text search and generic-token OR ranking. It does not replace `SEARCH-ARCHITECTURE.md` SEO/hub rules.

---

## 1. Problem

Public search and Growth Center institution search return too many weakly related institutions.

Concrete production evidence:

- Query `"Bilgi Özel Öğretim Kursu"` with Bakırköy scope returns **134** results.
- 134 equals **all published Bakırköy `dershane` / `kursu` rows**, not institutions whose brand is “Bilgi”.
- First-page noise includes İNCİRLİ FEN BİLİMLERİ LOCA, KÖŞK AKADEMİ, MİNE AKADEMİ, NET BİLİM, MURAT, EDİM.
- `"bilgi"` can score against `"bilimleri"` via substring.
- İstanbul free-text can load **~7.496** published institution documents per search (`listPublishedCandidates` has no limit).
- Growth Center `/api/admin/outreach-institution-search` has stopwords, but falls back to generic tokens (`ozel` / `kursu`) when nothing distinctive remains, and still uses `name.includes(token)`.

Parents cannot find a named institution. Admins see wide match lists. Firestore read cost scales with city size, not query specificity.

---

## 2. Root Cause

Two pipelines, one shared data/ranking mistake.

1. **Public search** (`/search` → `searchPublicInstitutions` → `FirestoreInstitutionRepository.search` → `listPublishedCandidates` → `searchInstitutionsInStore`):
   - Loads every published document in city/district/type.
   - Tokenizes the query with **no stopwords**.
   - Any token match OR’s the document in (`ozel`, `ogretim`, `kursu` each +400).
   - Substring: `keyword.includes(token)` so `bilimleri` matches `bilgi`.
   - Tie-break is `qualityScore` (mostly 0) then document id → alphabetical dump of every course.

2. **Growth Center search** (`searchOutreachInstitutions` → `findByExactName` / `findBySearchKeyword`):
   - Bounded `array-contains` (good).
   - Distinctive-token helper **falls back to stopwords** when the query is only generic (`Kurs`, `Özel Öğretim Kursu`).
   - Scoring still rewards any token appearing as a substring of the name.

3. **Index payload** (`FirestoreInstitutionMapper.toFirestore`):
   - `searchKeywords` = tokens from **name + city + district + address**.
   - Address noise (`mah`, `cad`, `sk`, `no`, house numbers) and city name sit on every document.
   - Generic MEB words sit on almost every course.

4. **Not the cause:** pagination (`totalItems` is real), empty-query fallback, Algolia absence, or automatic matching. Search hit does not assign `institutionId`.

---

## 3. Goals

1. Rank known-item queries by **name relevance** (exact / prefix / phrase / distinctive tokens).
2. Stop generic MEB tokens from producing results by themselves.
3. Stop `"bilgi"` → `"bilimleri"` false positives.
4. Cap public free-text Firestore reads well below city catalog size (İstanbul ~7.5k must not be scanned).
5. Share one token + ranking contract between public search and Growth Center search.
6. Keep matching/claim/delivery/cost guards unchanged.
7. Reindex `searchKeywords` safely; do not rewrite institution business fields.

---

## 4. Non-goals

- New search engine (Algolia, Meilisearch, Typesense, Elasticsearch).
- Rewriting Growth Center UI, campaign wizard, or matching security model.
- Auto-selecting an institution from a search hit.
- Changing claim Ready/Blocked, unmatched/ambiguous gates, DeliveryJob engine, SMTP, EMDS.
- Changing `OUTREACH_PREPARE` / EMERGENCY billing protection.
- Nationwide unscoped public free-text (`cityId` gate stays).
- Map/radius search, typo engine, synonym product, university vertical.
- Hard-capping a city dump at 500/1000 and ranking that arbitrary slice (that is a worse false ranking).

---

## 5. Current Architecture

```text
PUBLIC
  Home/header GET /search?q&city&district&type
    apps/web/src/app/search/page.tsx
    searchPublicInstitutions()
    InstitutionSearchRepository.search()
    listPublishedCandidates(city|district|type)  // unbounded
    searchInstitutionsInStore()                   // OR tokens + substring
    pageSize 12, totalItems = all in-memory hits

GROWTH CENTER
  GET /api/admin/outreach-institution-search?q&cityId&districtId
    searchOutreachInstitutions()
    findByExactName (nameFolded ==) limit ≤20
    findBySearchKeyword (array-contains) limit ≤20
    scoreOutreachInstitutionHit (includes/substring)
    UI limit 8
```

Shared data: `institutions.name`, `nameFolded`, `searchKeywords`, `cityId`, `districtId`, `lifecycleStatus`.

Not shared: scoring, stopwords (GC only), candidate loading.

Existing indexes (already in `firestore.indexes.json`):

- `cityId` + `searchKeywords` CONTAINS
- `districtId` + `searchKeywords` CONTAINS
- `nameFolded` + `cityId`
- `nameFolded` + `cityId` + `districtId`

GC keyword search already uses the CONTAINS indexes. Public free-text **does not**.

---

## 6. Proposed Architecture

Keep Firestore as the engine. Change **what is queried** and **how hits score**.

```text
Shared (domain)
  foldTurkishText (unchanged)
  INSTITUTION_SEARCH_STOPWORDS
  tokenizeInstitutionSearchKeywords(name)     // index-time, name-only
  distinctiveSearchTokens(query, scope)      // query-time, no generic fallback

PUBLIC free-text (city required, unchanged gate)
  1. Parse distinctive tokens
  2. If none → generic-only path (no city dump)
  3. Else bounded recall:
       nameFolded == foldedQuery (limit EXACT_CAP)
       searchKeywords array-contains probeToken + city and/or district (limit KEYWORD_CAP)
  4. Drop unpublished
  5. Shared ranker
  6. Paginate the ranked bounded set (totalItems ≤ candidate cap, not city size)

GROWTH CENTER
  Same token + ranker
  Same bounded findByExactName / findBySearchKeyword
  No stopword fallback
  No unscoped keywordAny
  No auto-match
```

`listPublishedCandidates()` **must not** run on the public free-text path.

Empty-`q` browse (structured city/type/district + cursor) stays as today.

---

## 7. Token Strategy

### Folding

Keep `foldTurkishText` (tr-TR lower, diacritics → ascii, punctuation → space). Display names unchanged.

Stopwords are stored **folded**. Input `özel` / `Özel` / `ozel` all map to `ozel`.

### Central stopword list

New domain module (single source of truth), imported by public search, GC search, tokenizer, tests.

Minimum required (folded):

`ozel`, `ogretim`, `kursu`, `kurs`, `akademi`, `mah`, `cad`, `sk`, `no`

Recommended same list as today’s GC set (already folded), plus address junk:

`okul`, `okulu`, `kolej`, `koleji`, `anadolu`, `lisesi`, `lise`, `merkezi`, `merkez`, `ve`, `the`, `ic`, `kapi`, `diger`, `kapilar`, `blok`

List is `Object.freeze` + unit tests: `isInstitutionSearchStopword("Özel") === true`.

### Index-time keywords

Source = **institution name only**.

```
keywords = unique( fold(name).split(" ") )
  .filter(token => token.length >= 3)
  .filter(token => !isStopword(token))
```

**Do not index:** address, phone, MEB/numeric codes, cityName, districtName.

Geography stays **structured filters** (`cityId` / `districtId`). Putting `istanbul` / `bakirkoy` on every document would make a name search for those tokens dump the city via `array-contains` — both a relevance and a cost bug.

Example: name `BİLGİ ÖZEL ÖĞRETİM KURSU` → keywords **`["bilgi"]`** only.

### Query-time tokens

```
distinctive = unique( fold(q).split(" ") )
  .filter(len >= 3)
  .filter(!stopword)
  .filter(!geo tokens copied from active city/district filters)
```

**No fallback** that re-adds stopwords.

- `"Bilgi Özel Öğretim Kursu"` → `["bilgi"]`
- `"Kadro Kurs"` → `["kadro"]`
- `"Özel Öğretim Kursu"` / `"Kurs"` → `[]` (generic-only)
- `"Bilgi"` / `"BİLGİ"` → `["bilgi"]`

### Probe token for Firestore

If multiple distinctive tokens, `array-contains` **one** probe: longest token (then lexicographic tie-break). Remaining distinctive tokens are AND-checked in memory on the bounded set.

Do not issue N keyword queries per search (cost). One keyword query + one exact-name query is the budget.

---

## 8. Ranking Strategy

Shared function, e.g. `scoreInstitutionNameSearch(query, { name, nameFolded, searchKeywords })`.

Word set = `nameFolded.split(" ").filter(Boolean)` — **token equality only**.

Forbidden:

- `nameFolded.includes(token)` without word boundaries
- `keyword.includes(token)` / `token.includes(keyword)`
- `bilgi` matching `bilimleri`, `bilgisayar` (those are different words)

Allowed phrase: entire folded query as substring of `nameFolded` only when bounded by start/end or spaces (`" bilgi ozel "` style), **and** query still has ≥1 distinctive token (generic-only does not use this to recover a city dump).

Suggested integer bands (public and GC use the same bands; GC may scale to 0–100 as long as order is identical):

| Rank | Rule | Score |
| --- | --- | --- |
| 1 | `nameFolded === foldedQuery` | 1000 |
| 2 | `nameFolded.startsWith(foldedQuery)` (full query prefix of full name) | 800 |
| 3 | Word-bounded full phrase | 600 |
| 4 | **Every** distinctive token is an exact word in name **or** exact `searchKeywords` | 400 + 20×tokenCount |
| 5 | ≥2 distinctive tokens exact | 250 + 15×matched |
| 6 | Exactly 1 distinctive token exact | 100 |
| — | Generic tokens | **0** — never add |

Eligibility: if distinctive tokens exist, document **must** match at least one distinctive token exactly (word or keyword). Generic overlap alone → drop.

Tie-break (after score): higher `qualityScore`, then `name` localeCompare `tr`, then `id`. Do not sort primarily by id among equal generic hits — those hits should not exist.

Quality/premium/verified remain small additives **only if score > 0 from name rules** (keep current +10/+5 idea). They must not lift a non-matching course above a distinctive hit.

---

## 9. Public Search Changes

### Unchanged

- City required for free-text (`locationRequired`).
- Page size 12, URL `q/city/district/type/sort/page`.
- Empty `q` + structured filters = existing cursor browse.
- Published-only in public results.

### Free-text path (replace city dump)

Caps (constants, testable):

- `PUBLIC_SEARCH_EXACT_CAP = 10`
- `PUBLIC_SEARCH_KEYWORD_CAP = 40`
- Max reads per free-text request: **≤ 50** (10 + 40), never ~7496.

Algorithm:

1. If `!cityId` → location gate (today).
2. Distinctive tokens from `q`.
3. **Generic-only** (`distinctive.length === 0`):
   - Do **not** call `listPublishedCandidates`.
   - Optional cheap exact: `nameFolded == foldedQuery` limit 10 (almost never hits for “Özel Öğretim Kursu”).
   - Return **empty list**, `totalItems = 0`, existing empty-state copy plus one extra hint: *“Daha spesifik bir kurum adı yazın veya ilçe / kurum türü filtresi kullanın.”*
   - Do **not** auto-switch the query into “all dershane in district”. Browse already exists when `q` is empty and type/district are set. User can clear `q` and set type.
4. **Has distinctive token:**
   - Exact name query (city, district if set).
   - Keyword query: `searchKeywords` array-contains probe + **district if set, else city**. Do not also run unscoped / city-wide extra fan-out when district is set.
   - If district query returns 0 and district was set, **one** retry: same keyword + city only, still `KEYWORD_CAP` (for names that omit the district word). Still not a city dump.
   - Filter `lifecycleStatus === published` in memory (existing CONTAINS indexes omit lifecycle; 40 docs is acceptable).
   - Rank, paginate. `totalItems` = ranked hits in this candidate set (≤ 50), **not** city size.

### UX for 134 → ~few

`"Bilgi Özel Öğretim Kursu"` + Bakırköy: probe `bilgi` + district → production count of published Bakırköy keyword `bilgi` is **3**. Those rank by name. İNCİRLİ / NET BİLİM / EDİM are out.

### `listPublishedCandidates`

Stop using it for free-text. Keep the method for any remaining non-search callers or delete later if unused. Do not add a limit-on-dump as the search design.

---

## 10. Growth Center Search Changes

Endpoint and UI (search box + Seç) stay.

Align `searchOutreachInstitutions` with shared tokens + ranker.

Must change:

- Import shared stopwords; **delete fallback** that returns `ozel`/`kursu` when distinctive is empty.
- Generic-only query → `{ items: [], documentsRead: 0..exactCap }` and existing “Sonuç bulunamadı…” copy (optionally mention distinctive name).
- Probe = distinctive token, never generic.
- Do not call `findBySearchKeyword` without city/district when campaign has scope; do not third-hop `keywordAny` nationwide.
- Scoring: word-boundary / keyword equality, same rank order as public.
- `"Kadro Kurs"` → token `kadro` → GENÇ KADRO… ranks above unrelated `kursu` rows.
- Caps stay: `OUTREACH_SEARCH_QUERY_CAP ≤ 20`, UI ≤ 8.
- Candidate `ids=` `getById` path unchanged (≤ 10).

Must not change:

- Assign still requires explicit Seç (`campaignId` + `recipientId` + `institutionId`).
- Unmatched / ambiguous claim block.
- Import / prepare / approve / run / delivery.

---

## 11. Reindex Strategy

Existing ~27k docs have dirty `searchKeywords`. New writes from mapper are not enough.

### What changes

- `searchKeywords` — rewrite to name-only distinctive tokens.
- `nameFolded` — recompute from `name` (same fold function; should usually be identical).
- **Never** touch: contact, address, status, type, geo ids, media, quality, claim, google sync, etc.

### Compatibility

- Readers that OR generic keywords will see **fewer** hits after reindex — that is the fix.
- GC `array-contains "kadro"` keeps working if `kadro` is in the name.
- `array-contains "ozel"` will stop matching after reindex (desired).
- Old and new format can coexist during rollout: query uses distinctive tokens that exist in both (e.g. `bilgi`, `kadro`). Generic queries already must not use `array-contains`.

### Job

New script under `packages/firebase/scripts/` (e.g. `reindex-institution-search-keywords.ts`):

- `--dry-run` (default): count docs that would change; sample diffs; **no writes**.
- `--apply --limit N`: batched writes, idempotent (`newKeywords` equal skip).
- Batch size ≤ 400; delay between batches; log last id cursor; resumable.
- Filter optional `--cityId` for staged prod (İstanbul first).
- Auth: existing Admin credentials only; not an HTTP public route.
- Fail closed: no `listAll` into one array of 27k in a Next request; script streams/pages by `__name__` or city chunks.

Do not run apply from web request handlers.

---

## 12. Firestore Indexes

**Reuse existing:**

| Query | Index |
| --- | --- |
| keyword + city | `cityId` ASC + `searchKeywords` CONTAINS |
| keyword + district | `districtId` ASC + `searchKeywords` CONTAINS |
| exact name + city | `nameFolded` + `cityId` |
| exact name + city + district | `nameFolded` + `cityId` + `districtId` |

**Not required for v1:** `lifecycleStatus` on those composites (filter published in memory on ≤40 docs).

**Do not add:** collection-wide `searchKeywords` CONTAINS without geo (nationwide keyword).

Deploy indexes **before** public search switches off `listPublishedCandidates`, if any query shape is new. Current GC already uses CONTAINS+city/district — public will use the same shape.

---

## 13. Cost Protection

| Path | Max Firestore reads (target) |
| --- | --- |
| Public free-text, distinctive, city or district | ≤ 10 exact + 40 keyword (+ 40 city retry if district empty) ≤ **90** worst case; typical **≤ 50** |
| Public free-text, generic-only | **0 or ≤ 10** exact |
| Public empty-q browse | unchanged cursor page (not this spec) |
| Public without city | **0** (gate) |
| GC search | ≤ 20 exact + 20 keyword + ≤10 getById; **no list()** |
| Import / match auto / prepare | unchanged; no `institutionRepository.list()` on Growth import |
| Reindex script | batched; ops-only; not user-path |

Hard rules:

- No `listAll()` on public or GC search.
- No `institutionRepository.list()` on search or GC match search.
- No İstanbul 7.5k candidate load.
- No 27k nationwide scan on a user request.
- `OUTREACH_PREPARE` / EMERGENCY untouched.
- Hard cap on an **unfiltered city dump** is not the design.

If district retry + city keyword both run: still `array-contains` distinctive token, not all institutions in İstanbul.

---

## 14. Acceptance Criteria

**A.** `"Bilgi Özel Öğretim Kursu"` + Bakırköy: institutions with word `bilgi` in the name rank first (e.g. BAKIRKÖY İLGİDEKİ ÇAĞDAŞ BİLGİ…, ÖZEL BAKIRKÖY BİLGİ…). İNCİRLİ FEN BİLİMLERİ, NET BİLİM, EDİM, MURAT, KÖŞK AKADEMİ **not** in the first page / not in the result set.

**B.** `"Bilgi"`: matches token `bilgi`. Does **not** match `bilimleri` / İNCİRLİ FEN BİLİMLERİ solely via substring.

**C.** `"Kadro Kurs"` + Bakırköy: `kadro` distinctive; GENÇ KADRO… (and other `kadro` names) on top. `kurs` is not a ranking signal.

**D.** `"Özel Öğretim Kursu"`: does **not** return 134 Bakırköy courses. Empty (or exact-name-only if a school is literally named that).

**E.** İstanbul public free-text: **must not** read ~7.496 candidates. Tests spy `listPublishedCandidates` / `listAll` not called; keyword/exact limits asserted.

**F.** GC search: no catalog scan, no `list()`.

**G.** Manual match: search results do not write `institutionId` until Seç.

**H.** Unmatched / ambiguous still block claim/delivery.

**I.** EMERGENCY `OUTREACH_PREPARE` tests still pass; import still not gated by that guard.

---

## 15. Test Plan

### New / extend

- Domain: fold + stopword + tokenize name-only + distinctive tokens (no fallback).
- Ranker: cases A–D; `bilgi` vs `bilimleri`; generic-only score 0 / empty.
- Public search repository tests: spy candidate loader; assert caps; no `listAll`.
- GC `search-outreach-institutions.test.ts`: Kadro Kurs; generic-only empty; no `list` calls.
- Mapper: `searchKeywords` from name only; address not present.
- Reindex dry-run unit with fixture docs.

### Regression (must still run)

| Area | Files / suites |
| --- | --- |
| Outreach import | `growth-005`, `growth-006`, `prepare-campaign-from-import` |
| Match / claim gates | `growth-007-institution-match` |
| Delivery | `outreach-delivery`, `delivery-worker`, `email-delivery-handler` |
| Billing | `billing-protection`, `growth-006` EMERGENCY |
| Firebase institutions | `firestore-institution-repository.test` (update free-text spies from `listPublishedCandidates` to keyword/exact) |
| UI search | `recipient-institution-match.test`, search-results content tests (copy if hint added) |
| Web | `search-public-institutions.test` |
| Domain institution | existing institution tests if tokenizer moves |

### Growth Center journey (manual / existing tests)

Import 20 → persist recipients → match (search/select) → Prepare matched only → Approve → Run. No change to job enqueue rules. Search quality change must not call `list()` during import or match.

---

## 16. Rollout Plan

1. Land shared token + ranker + mapper (new writes clean).
2. Confirm indexes already deployed (they are specified in repo).
3. Switch GC search (small, already bounded) — verify Bakırköy matching UI.
4. Switch public free-text off `listPublishedCandidates`.
5. Dry-run reindex on a city; inspect diffs.
6. Apply reindex by city chunks; monitor quota.
7. Keep old stopword-OR tests replaced, not left green against the bug.

Feature flag optional (`EDUATLAS_SEARCH_BOUNDED_KEYWORDS=1`) if prod switch needs a one-commit kill switch; not required if GC-first + public follow in the same PR after tests.

---

## 17. Rollback Plan

1. Revert application ranking/candidate code to previous commit (city dump + OR). Cost/quality regress; data still valid.
2. Reindex is **forward-compatible** with old ranker for distinctive tokens; rolling back code without restoring old keywords is OK for `bilgi`/`kadro`. Generic OR will **undermatch** until a reverse reindex (re-add name+address+geo tokens) — only if rollback of quality fix is required long-term.
3. Do not restore address tokens unless explicitly rolling back the product decision.
4. No campaign/recipient migration. No claim/delivery rollback.

---

## 18. Files to Change

### Domain (new + edit)

- **New:** `packages/domain/src/institution/institution-search-tokens.ts` (stopwords, distinctive tokens, name tokenizer, word-boundary helpers)
- Edit: `packages/domain/src/institution/validation.ts` — `tokenizeSearchKeywords` delegates to name-only rules or deprecate in favor of the new API
- Edit: `packages/domain/src/institution/index.ts` exports
- Tests: `institution` / new `institution-search-tokens.test.ts`

### Application

- Edit: `packages/application/src/outreach/search-outreach-institutions.ts` — shared tokens, remove fallback, shared score
- Edit: `packages/application/src/outreach/search-outreach-institutions.test.ts`
- Optional shared: `packages/application/src/institutions/score-institution-name-search.ts` if ranker should live next to search query (or keep ranker in firebase keyword module but **import domain tokens**; public + GC must not diverge)

### Firebase

- Edit: `packages/firebase/src/institutions/institution-keyword-search.ts` — ranker + eligibility
- Edit: `packages/firebase/src/institutions/firestore-institution-repository.ts` — free-text uses exact+keyword, not `listPublishedCandidates`
- Edit: `packages/firebase/src/institutions/firestore-institution-document-store.ts` — caps already; ensure public can pass published-only filter in memory
- Edit: `packages/firebase/src/institutions/firestore-institution-mapper.ts` — name-only keywords
- Edit: `packages/firebase/src/institutions/in-memory-institution-document-store.ts` — same keyword semantics
- Edit: `packages/firebase/src/institutions/firestore-institution-repository.test.ts`
- **New:** `packages/firebase/scripts/reindex-institution-search-keywords.ts`
- Seeds: `packages/firebase/src/seeds/seed-loader.ts` / seed keywords — drop address/generic-only seed tokens where they fight the contract

### Web / UI

- Edit: `apps/web/src/server/institutions/search-public-institutions.ts` only if result DTO needs `genericQueryHint`
- Edit: `apps/web/src/server/institutions/search-public-institutions.test.ts`
- Edit: `packages/ui/src/search-results/search-results-page.tsx` (empty-state hint for generic-only)
- GC panel: no UX rewrite; optional copy already “netleştirin”

### Indexes

- `firestore.indexes.json` — **no new index required** for v1 if queries match existing CONTAINS + nameFolded composites
- Confirm deployed in Firebase console before public switch

### Reindex location

- `packages/firebase/scripts/reindex-institution-search-keywords.ts` run via existing `tsx --env-file=apps/web/.env.local` pattern

### Do not change

- Outreach delivery, SMTP, claim actions, `OUTREACH_PREPARE`, import cost guards, assign mutation security

---

## 19. Risks

| Risk | Mitigation |
| --- | --- |
| Reindex quota / timeout | City chunks, dry-run, resume cursor, batch ≤400 |
| Distinctive token still common (`fen`, `net`) | Word-exact still better than `kursu` OR; ranking prefers more tokens; later IDF is out of scope |
| District retry doubles reads | Only if district keyword returns 0; still capped |
| Missing `lifecycleStatus` on CONTAINS index | In-memory published filter on small set |
| Seeds/tests still expect address keywords | Update tests to name-only |
| Users searching only “kurs” | Empty + filter hint; browse without `q` |
| Rollback after reindex | Distinctive queries OK; generic OR won’t dump courses (acceptable) |

---

## 20. Implementation Steps

1. Domain stopwords + tokenizer + distinctive tokens + tests (no generic fallback).
2. Shared name ranker + substring tests (`bilgi` / `bilimleri`).
3. Mapper + in-memory store: name-only `searchKeywords`.
4. GC `searchOutreachInstitutions`: shared tokens/ranker; remove fallback and `keywordAny`.
5. Public `search()`: exact + keyword caps; remove free-text `listPublishedCandidates`.
6. Empty-state hint for generic-only public search.
7. Fix repository tests that spy on city dump.
8. Run GROWTH-005/006/007, delivery, billing-protection.
9. Reindex script dry-run; then apply by city.
10. Prod verify: Bakırköy “Bilgi Özel Öğretim Kursu”, “Kadro Kurs”, İstanbul read path.

---

## Self-review

- Cost: user-facing search never loads a city catalog; recall is `array-contains` distinctive token + exact name, both limited.
- Hard-cap-on-dump was rejected.
- City/district are filters, not keywords — avoids `istanbul` dumping 7.5k via CONTAINS.
- GC and public share tokens/ranker; matching stays explicit Seç.
- No new search vendor; existing indexes reused.
- Reindex is ops-batched, dry-run first, field-scoped.
- Claim/delivery/EMERGENCY out of scope.

**Not implemented. No commit/push.**
