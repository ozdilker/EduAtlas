# PRD-SEO-000 — URL Architecture Audit & Protection

| Field | Value |
| --- | --- |
| **Status** | Completed (analysis only) |
| **Date** | 2026-08-02 |
| **Scope** | Read-only audit of live App Router URLs |
| **Code changes** | None |

---

## Verdict

**Mevcut URL mimarisi SEO açısından genel olarak uygundur. Canlı routing / slug / navigation kodu değiştirilmemelidir.**

Kritik bir “URL’yi şimdi değiştir” zorunluluğu yoktur. Aşağıdaki maddeler yalnızca raporlanmış iyileştirme önerileridir; otomatik uygulanmamıştır.

---

## Inventory (implemented)

| Surface | Live path | Notes |
| --- | --- | --- |
| Ana sayfa | `/` | OK |
| Hakkımızda | `/about` | OK |
| İletişim | `/contact` | OK |
| Kurum detay | `/institutions/[slug]` | ASCII slug |
| Şehir index | `/cities` | OK |
| Şehir | `/cities/[city]` | e.g. `/cities/istanbul` |
| İlçe | `/cities/[city]/[district]` | e.g. `/cities/istanbul/kadikoy` |
| Kategori index | `/categories` | Product uses `/categories` (not `/institution-types`) |
| Kategori | `/categories/[category]` | e.g. `/categories/anaokulu` |
| Şehir + kategori | `/cities/[city]/types/[type]` | Implemented |
| İlçe + kategori | — | **Not implemented** (spec had `/cities/[city]/[district]/[type]`) |
| Arama | `/search?q&page&city&…` | `noindex, follow` |
| Owner | `/owner/*` | Layout `noindex, nofollow` |
| Admin | `/admin/*` | Layout `noindex, nofollow` |
| Auth / veli | `/login`, `/register`, `/forgot-password`, `/veli/*` | Page-level `noindex` |
| Claim invite | `/claim?token=…` | Transactional; no dedicated robots meta found |
| Legal | `/privacy`, `/terms`, `/cookies`, `/kvkk` | Static public |

Geography seed check (81 cities, 973 districts): **0** slugs outside `^[a-z0-9-]+$`. Examples: `istanbul`, `kadikoy`, `cankaya`, `sanliurfa`, `canakkale`.

---

## Per-surface checklist

### ✓ Ana sayfa — `/`

| Check | Result |
| --- | --- |
| Okunabilir | ✓ |
| Türkçe karakter yok | ✓ |
| Trailing slash tutarlı | ✓ (Next default: no trailing slash) |
| Lowercase | ✓ |
| Duplicate risk | Düşük; canonical helper slash/query strip eder |
| Dinamik parametre | Yok |

**Karar:** Değiştirme.

### ✓ Hakkımızda / İletişim — `/about`, `/contact`

| Check | Result |
| --- | --- |
| Okunabilir / ASCII / lowercase | ✓ |
| Canonical | Root metadata’ya bağlı; absolute canonical eksik olabilir (küçük tutarlılık konusu) |

**Karar:** URL değiştirme. İleride SEO PRD’de `build*PageSeo` ile absolute canonical eklenebilir.

### ✓ Kurum detay — `/institutions/[slug]`

| Check | Result |
| --- | --- |
| Okunabilir | ✓ `/institutions/ornek-anaokulu` |
| Türkçe karakter | ✓ `normalizeInstitutionSlug` + `foldTurkishText` |
| Slug | ✓ domain `SLUG_PATTERN` |
| SEO package | ✓ `@eduatlas/seo` `buildInstitutionPageSeo` |
| Unpublished | `noindex` path mevcut |

**Karar:** Değiştirme. Slug üretimi / linkler korunmalı.

### ✓ Şehir / ilçe — `/cities/...`

| Check | Result |
| --- | --- |
| Okunabilir | ✓ `/cities/istanbul/kadikoy` |
| ASCII geo slug | ✓ `slugifyGeographyName` |
| Canonical (ilçe) | Relative `/cities/{city}/{district}` set |
| İçerik | İlçe hub şu an placeholder (URL değil, içerik konusu) |

**Karar:** URL değiştirme.

### ✓ / ⚠ Kategori — `/categories/...`

| Check | Result |
| --- | --- |
| Okunabilir / ASCII | ✓ |
| Spec drift | `ROUTES.md` `/institution-types` der; canlı `/categories` |
| Duplicate | ⚠ `/categories/dil-okulu` (canonical type slug) **ve** `/categories/dil-kursu` (alias + nav link) aynı `LanguageSchool` içeriğine çözülüyor; her biri kendi path’ini canonical alıyor |

**Karar:** Prefiks `/categories` **korunmalı** (kırıcı rename yapma). Alias konusu ayrı öneri (aşağıda).

### ✓ Şehir + kategori — `/cities/[city]/types/[type]`

Okunabilir, ASCII, relative canonical set. **Değiştirme.**

### ⚠ İlçe + kategori

Canlı route yok. Bu bir URL bozulması değil; gelecek hub PRD kapsamı. Mevcut URL’leri değiştirmeden eklenmeli.

### ✓ Arama — `/search`

Query params (`q`, `page`, facets) SEO’yu bozmaz çünkü `buildSearchPageSeo` → **`noindex, follow`**. Canonical path `/search` (query strip). **Değiştirme.**

### ✓ Owner / Admin — `/owner/*`, `/admin/*`

| Check | Result |
| --- | --- |
| Meta robots | ✓ `index: false`, `follow: false` (layout) |
| `robots.txt` Disallow | ⚠ Henüz `robots.ts` / `robots.txt` yok |
| Sitemap | ⚠ `sitemap.ts` yok |

**Karar:** Panel path’lerini değiştirme. Crawler-level koruma sonraki SEO PRD’de `robots.txt` + sitemap ile güçlendirilmeli (meta noindex zaten var).

---

## Cross-cutting controls

| Topic | Finding | Action now |
| --- | --- | --- |
| Trailing slash | `next.config` `trailingSlash` yok → Next default **without** slash; `buildCanonical` trailing slash strip eder | Koru; middleware ile agresif rewrite ekleme (bu PRD dışı) |
| Lowercase | Geo + institution slug normalize lowercase | Koru |
| Türkçe karakter | Fold → ASCII | Koru |
| `?id=` style SEO params | Public SEO yüzeylerinde yok; search facets noindex | Koru |
| Spec vs live | `/institution-types` vs `/categories`; district×type missing | Live URL’yi bozma |

---

## Findings summary

### ✓ URL yapısı uygun (değiştirme)

- `/`, `/about`, `/contact`
- `/institutions/[slug]`
- `/cities`, `/cities/[city]`, `/cities/[city]/[district]`
- `/cities/[city]/types/[type]`
- `/categories`, `/categories/[category]` (prefix olarak)
- `/search` (noindex stratejisi)
- `/owner/*`, `/admin/*` (path + meta noindex)

### ⚠ İyileştirilebilir (öneri — uygulanmadı)

#### 1. Dil kategorisi duplicate URL

- **Sebep:** Nav `href: /categories/dil-kursu`; domain canonical type slug `dil-okulu`; her ikisi de aynı tipe map; SEO her path için ayrı canonical üretiyor → soft duplicate risk.
- **Öneri (gelecek PRD):** Tek kanonik seç (`dil-okulu` veya `dil-kursu`); diğerine 301 + canonical hizala; nav’ı kanoniğe çek. **Şimdi otomatik uygulanmadı.**

#### 2. `robots.txt` / sitemap yok

- **Sebep:** Meta `noindex` var; Search Console / crawler Disallow ve sitemap henüz yok (`SEO-ARCHITECTURE.md` bekliyor).
- **Öneri:** Ayrı PRD — `robots.ts` (`Disallow: /owner`, `/admin`, auth, claim) + `sitemap.ts` (yalnızca public indexable). Routing değiştirme.

#### 3. `/claim?token=…`

- **Sebep:** Token’lı transactional URL; sayfa-level robots meta görülmedi.
- **Öneri:** `noindex, nofollow` metadata; robots Disallow `/claim`. Path değiştirme.

#### 4. İlçe × kategori hub eksik

- **Sebep:** Spec’te var, App Router’da yok.
- **Öneri:** Yeni route ekle (mevcut city/district/type URL’lerini bozmadan). Bu PRD’de yok.

#### 5. Relative vs absolute canonical tutarsızlığı

- **Sebep:** City/category/institution SEO absolute canonical kullanıyor; bazı hub placeholder’lar relative canonical set ediyor.
- **Öneri:** İleride tüm public SEO yüzeylerinde `buildCanonical` / `build*PageSeo`. URL path değiştirme.

#### 6. About / contact / legal absolute canonical

- **Sebep:** Basit `Metadata` title/description; absolute canonical net değil.
- **Öneri:** Küçük SEO metadata PRD. Path’ler aynı kalsın.

---

## Değiştirilmemesi gerekenler

Bu audit kapsamında **yalnızca okundu**; değiştirilmedi ve sonraki işlerde de bozulmamalı (zorunlu SEO/teknik gerekçe + ayrı onay olmadan):

1. **Routing** — App Router file tree ve path segment’leri  
2. **Sayfa yapısı** — public / owner / admin ayrımı  
3. **Linkler** — nav, footer, breadcrumb href’leri (dil alias hariç ayrı onaylı PRD)  
4. **Slug üretimi** — `slugifyGeographyName`, institution slug normalize, type slug map  
5. **Navigation** — `packages/ui` public nav sözleşmesi  

---

## Acceptance criteria

| Criterion | Status |
| --- | --- |
| Mevcut URL mimarisi tamamen analiz edildi | ✓ |
| SEO riskli URL’ler raporlandı | ✓ |
| Uygun URL’ler için değişiklik yok | ✓ |
| Routing sistemi değişmedi | ✓ |
| Hiçbir mevcut link kırılmadı | ✓ |
| Hiçbir sayfa URL’si otomatik değişmedi | ✓ |
| Kod değişikliği yok; yalnızca analiz raporu | ✓ (bu dosya) |

---

## Process note — verification

| Check | Result |
| --- | --- |
| `npm test` | ✓ 96 files / 358 tests passed |
| `npm run typecheck` | ✗ Pre-existing errors in `packages/application/src/billing/present-owner-leads.test.ts` (TS18048 possibly undefined). **Unrelated to this PRD; no fix applied** (analysis-only scope). |

Bu PRD routing/kod değiştirmedi.
