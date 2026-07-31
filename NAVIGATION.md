# EduAtlas — Navigation Architecture

| Field | Value |
| --- | --- |
| **Product** | EduAtlas |
| **Document** | NAVIGATION.md |
| **Version** | 1.0 |
| **Sprint** | Sprint-001 — Foundation |
| **Task** | Task-012 |
| **Status** | Binding UX navigation specification |
| **Last updated** | 14 July 2026 |

---

## Document control

This document defines **how users move through EduAtlas** — global chrome, search journeys, breadcrumbs, footer, related links, CTAs, and analytics.

Navigation must prioritize:

1. **Discovery** — find the right institution fast  
2. **Trust** — clear hierarchy, honest labels, stable wayfinding  
3. **Lead generation** — contact paths always within one gesture on profiles  

| Related document | Role |
| --- | --- |
| `ROUTES.md` | Canonical URLs |
| `UI-ARCHITECTURE.md` | Screens & shells |
| `SEO-ARCHITECTURE.md` | Hub graph & internal linking |
| `INSTITUTION-PROFILE-SPECIFICATION.md` | Profile CTAs |
| `PRD.md` | User journeys |

**Non-goals:** Implementation code, visual design tokens, or copywriting finalization.

---

## 1. Purpose

EduAtlas is Türkiye’s education ecosystem platform. Navigation is the product’s wayfinding system across:

- Public Website (anonymous visitors / parents)  
- Owner Portal (`/owner`)  
- Admin Panel (`/admin`)  

Public navigation is SEO-aware: every major crawl path must also be a human path.

---

## 2. User types & navigation contexts

| User type | Default surface | Nav chrome | Primary jobs |
| --- | --- | --- | --- |
| **Anonymous Visitor** | Public | Public header/footer | Discover → open profile → lead/call |
| **Parent** | Public (+ future `/favorites`) | Public (+ account menu later) | Same as visitor; save/compare later |
| **Institution Owner** | `/owner` | Dashboard layout | Edit profile, answer leads, claim |
| **Moderator** | `/admin` | Admin layout (limited items) | Claims, content moderation |
| **Administrator** | `/admin` | Full admin nav | Catalog, SEO, users, settings |

Parents and anonymous visitors share public chrome in MVP.

---

## 3. Navigation principles

1. **Search-first** — search is always one tap/click away on public pages.  
2. **Shallow primary, deep hubs** — top nav stays short; city/type depth lives in hubs and mega panels.  
3. **One primary CTA per context** — public marketing CTA ≠ profile lead CTA; do not compete.  
4. **Honest hierarchy** — breadcrumbs match URL ancestry (`ROUTES.md`).  
5. **Lead proximity** — on institution pages, contact CTAs outrank exploratory nav.  
6. **No footer spam** — capped link sets; SEO integrity over link quantity.  
7. **Role-hiding** — users never see nav items they cannot use.  
8. **Labeled paid placement** — featured/sponsored never disguised as organic nav.

---

## 4. Primary navigation (desktop, public)

### 4.1 Header structure (left → right)

| Slot | Element | Behavior |
| --- | --- | --- |
| 1 | **Logo** | Links to `/`; brand-first affordance |
| 2 | **Global Search** | Field + submit → `/search?q=…` (and optional live suggest later) |
| 3 | **Institution Types** | Menu/panel → `/institution-types` + featured type links |
| 4 | **Cities** | Menu/panel → `/cities` + priority cities (`/cities/[city]`) |
| 5 | **Universities** | Link or menu → future `/universities` (**MVP:** hide, or “Yakında” disabled — prefer **hide** until vertical ships) |
| 6 | **Blog** | `/blog` when enabled; else hide |
| 7 | **About** | `/about` |
| 8 | **Contact** | `/contact` |
| 9 | **Owner Login** | `/login` (label: “Kurum Girişi”); if session owner → `/owner` |
| 10 | **CTA** | Primary header CTA: **Kurumunu Sahiplen** → claim entry (`/register` or claim funnel) |

### 4.2 Desktop menus

**Institution Types menu**

- Link to index: `/institution-types`  
- Quick links: dershane, anaokulu, dil-kursu, ozel-okul, etut-merkezi, kres (slugs per taxonomy)  
- Optional: “Tümünü gör”

**Cities menu**

- Link to `/cities`  
- Priority: İstanbul, Ankara, İzmir, + configured set  
- Each → `/cities/[city]`

**Overflow rule:** If header width collapses items, move About/Contact/Blog into a “Daha fazla” menu before compressing Search.

### 4.3 What primary nav must not do

- List hundreds of districts.  
- Duplicate the entire footer.  
- Open multiple competing mega-menus with ads above organic links (ads, if any, labeled and secondary).

---

## 5. Mobile navigation (public)

### 5.1 Patterns

| Pattern | Role |
| --- | --- |
| **Compact header** | Logo + search affordance + menu button |
| **Drawer** | Primary links, types, cities, claim CTA, owner login |
| **Search-first experience** | Search icon expands field or routes to `/search`; home hero search remains primary entry |
| **Bottom navigation** | Optional MVP+; if used, max 4–5 items (e.g. Home, Search, Types, Claim/Account) — do not fight sticky profile CTA |
| **Sticky CTA** | **Profile only**: Call + Bilgi Al (+ WhatsApp if space) — not a global site bottom nav |

### 5.2 Mobile priority order

1. Reach search in ≤ 1 tap from any public page.  
2. Reach type or city browse in ≤ 2 taps.  
3. On institution profile, lead/call sticky bar always available while scrolling content.  
4. Claim and Owner Login available from drawer, not required on every viewport.

### 5.3 Drawer IA

```text
Ara (→ /search)
Kurum Tipleri → …
Şehirler → …
Blog (if live)
Hakkımızda
İletişim
────────────
Kurumunu Sahiplen  (primary)
Kurum Girişi
```

---

## 6. Search journeys

All journeys land on results that can open `/institutions/[slug]`. Prefer hub URLs when filters exactly match a hub (`ROUTES.md` / SEO canonical rules).

### 6.1 Search from homepage

```text
Home hero/header search
  → /search?q={keyword}
  → optional filters
  → institution card
  → /institutions/[slug]
  → lead / call
```

### 6.2 Search by city

```text
Header Cities → /cities/[city]
  OR /search with city filter
  → district or type child links
  → /cities/[city]/types/[type] or district hub
  → institution
```

### 6.3 Search by district

```text
/cities/[city] → district list
  → /cities/[city]/[district]
  → type links → /cities/[city]/[district]/[type]
  → institution
```

### 6.4 Search by institution type

```text
Header Types → /institution-types/[type]
  → city shortcuts → /cities/[city]/types/[type]
  → institution
```

### 6.5 Search by institution name

```text
Global search q={name}
  → /search relevance results
  → exact/brand match card
  → /institutions/[slug]
```

### 6.6 Future AI search

```text
Natural language (“Kadıköy’de İngilizce ağırlıklı anaokulu”)
  → AI interprets filters
  → same results UI (list/hubs)
  → institution
```

AI must not invent institutions; it only assists query → filters/results.

---

## 7. Breadcrumbs

### 7.1 Strategy

- Reflect **logical ancestry**, aligned with canonical URL hierarchy.  
- Always start with Ana Sayfa → `/`.  
- Last crumb is current page (not a link, or `aria-current="page"`).  
- Shown on hubs, institution, program, blog post; optional on search.  
- Markup must match visible trail; feed `BreadcrumbList` schema on public SEO pages.

### 7.2 Patterns by page

| Page | Breadcrumb example |
| --- | --- |
| **City** | Ana Sayfa › Ankara |
| **District** | Ana Sayfa › Ankara › Çankaya |
| **Type (national)** | Ana Sayfa › Kurum Tipleri › Dershane |
| **City × type** | Ana Sayfa › Ankara › Dershane |
| **District × type** | Ana Sayfa › Ankara › Çankaya › Dershane |
| **Institution** | Ana Sayfa › Ankara › Çankaya › Dershane › {Kurum Adı} |
| **Program (future, under institution)** | … › {Kurum} › {Program} |
| **Program hub (national)** | Ana Sayfa › Programlar › YKS |
| **Blog index** | Ana Sayfa › Blog |
| **Blog post** | Ana Sayfa › Blog › {Başlık} |
| **About/Contact** | Ana Sayfa › Hakkımızda / İletişim |

Institution trail should link middle crumbs to `/cities/[city]`, `/cities/[city]/[district]`, and the best type hub (district×type when available).

### 7.3 Portal breadcrumbs

Owner/Admin use **console section labels** (e.g. Panel › Talepler › Detay), not public SEO trails.

---

## 8. Footer

### 8.1 Hierarchy (public)

| Column | Contents | Cap guidance |
| --- | --- | --- |
| **Cities** | `/cities` + priority city links | ~8–12 |
| **Institution Types** | `/institution-types` + MVP types | All MVP types OK (~6) |
| **Universities** | Future `/universities` entry + samples | Hide column until vertical live |
| **Popular Searches** | Curated hub links (district×type money pages) | ~6–10, editorial, not infinite |
| **Resources** | Blog, guides, future exams/scholarships | Small |
| **Company** | About, Contact, Claim CTA text link | Small |
| **Legal** | Privacy, Terms | Required |

Footer also includes lightweight brand line; optional social links.

### 8.2 Footer rules

1. Only link to **indexable or intentional** public pages.  
2. No empty hubs.  
3. Popular Searches must be curated (quality > volume).  
4. Owner/Admin layouts use a **minimal footer** (legal + support), not the full public link graph.

---

## 9. Related navigation (on-page)

Contextual cross-links after the user reaches an institution (and similarly on hubs).

```text
Institution
  ↓
Nearby institutions          → same district (fallback city)
  ↓
Same category / type         → same primary type, prefer local
  ↓
Same district                → district hub + peers
  ↓
Blog                         → related articles (when tagged)
  ↓
Programs                     → on-page module or future program URLs
```

| Module | Nav target examples |
| --- | --- |
| Nearby | `/institutions/[other-slug]` |
| Same category | peers + `/cities/[city]/[district]/[type]` “Tümünü gör” |
| Same district | `/cities/[city]/[district]` |
| Blog | `/blog/[slug]` |
| Programs | in-page anchors or `/programs/[program]` / institution program routes |

Related nav supports SEO internal linking and parent exploration **without** replacing primary CTAs.

---

## 10. Calls to action

### 10.1 CTA taxonomy

| CTA class | Typical label | Where | Destination / action |
| --- | --- | --- | --- |
| **Primary CTA (marketing)** | Kurumunu Sahiplen | Header, home, unclaimed banners | Claim / register funnel |
| **Primary CTA (profile)** | Bilgi Al | Institution hero, sticky | Lead form |
| **Secondary CTA** | Ara / WhatsApp / Web Sitesi | Profile contact | `tel:`, WhatsApp, external site |
| **Sticky mobile CTA** | Ara + Bilgi Al | Institution mobile | Call + lead |
| **Institution claim CTA** | Bu kurumu sahiplen | Unclaimed profile | Claim flow |
| **Owner Login CTA** | Kurum Girişi | Header/drawer | `/login` |

### 10.2 Priority on institution profile

```text
1. Bilgi Al (lead)
2. Call / WhatsApp
3. Claim (only if unclaimed)
4. Exploratory (hubs, related)
```

### 10.3 Conflicts to avoid

- Do not sticky both “Sahiplen” and “Bilgi Al” as equal global bars sitewide.  
- Featured/sponsored buttons must be labeled and not replace organic related lists entirely.

---

## 11. End-to-end user journeys

### 11.1 Parent / anonymous visitor

**Happy path — local discovery to lead**

```text
Land (Google → district×type hub OR Home)
  → refine via filters or child links
  → open /institutions/[slug]
  → scan facts + trust badges
  → Bilgi Al (or Call)
  → success confirmation
```

**Alternate — brand search**

```text
Header search by name → /search → profile → lead
```

**Wayfinding recovery**

```text
Breadcrumb up to district/type → pick another institution
```

### 11.2 Institution Owner

```text
Public “Kurum Girişi” or Claim CTA
  → /login or /register
  → claim submit (if unclaimed)
  → (wait admin) OR /owner
  → /owner/institution (edit)
  → /owner/gallery
  → /owner/leads → respond / update status
  → “Siteye git” → public /institutions/[slug] (verify)
```

Portal nav (sidebar): Özet → Profil/Kurum → Galeri → Programlar → Talepler → Ayarlar (per `UI-ARCHITECTURE` / `ROUTES`).

### 11.3 Moderator

```text
/login → /admin
  → Claims queue
  → approve/reject
  → optional institution QA
  → done (no system settings)
```

### 11.4 Administrator

```text
/login → /admin
  → Institutions create/publish
  → Claims + Leads oversight
  → SEO overrides
  → Users / Reports / Settings
```

Admin nav is task-oriented (queues + catalogs), not marketing mega-menus.

---

## 12. Owner & Admin navigation (summary)

### 12.1 Owner (`/owner`)

| Item | Route |
| --- | --- |
| Özet | `/owner` |
| Hesap profili | `/owner/profile` |
| Kurum | `/owner/institution` |
| Galeri | `/owner/gallery` |
| Programlar | `/owner/programs` |
| Talepler | `/owner/leads` |
| Ayarlar | `/owner/settings` |
| Public profile | outbound `/institutions/[slug]` |

Mobile: drawer or bottom tabs mirroring the same set (collapse Analytics into Özet if needed).

### 12.2 Admin (`/admin`)

| Item | Route | Moderator | Admin |
| --- | --- | --- | --- |
| Panel | `/admin` | Yes | Yes |
| Kurumlar | `/admin/institutions` | Yes | Yes |
| Talepler | `/admin/leads` | Yes | Yes |
| Kullanıcılar | `/admin/users` | No | Yes |
| Blog | `/admin/blog` | Limited | Yes |
| SEO | `/admin/seo` | Limited | Yes |
| Raporlar | `/admin/reports` | Limited | Yes |
| Ayarlar | `/admin/settings` | No | Yes |

Claims queue may be top-level or under Kurumlar; badge counts belong in the shell.

---

## 13. Future navigation

| Feature | Nav placement |
| --- | --- |
| **Saved searches** | Account menu / search page (“Kayıtlı aramalar”) |
| **Favorites** | Header heart + `/favorites`; card/profile toggle |
| **Compare** | Results multi-select → `/compare` |
| **Events** | Primary or Resources + `/events` |
| **Scholarships** | Resources + `/scholarships` |
| **AI Assistant** | Persistent public entry (FAB or search mode); never blocks lead CTA |
| **Universities** | Primary nav item activates; footer column appears |
| **Owner subscription** | `/owner` nav → billing |

Ship behind flags; do not reserve empty primary slots that look broken.

---

## 14. Analytics

Track how navigation is used (complement profile CTA events).

| Event | Trigger |
| --- | --- |
| `nav_primary_click` | Desktop primary item (incl. logo) |
| `nav_mobile_open` | Drawer open |
| `nav_mobile_click` | Drawer item |
| `nav_bottom_click` | Bottom nav item (if any) |
| `search_submit` | Header/hero/search page submit |
| `search_suggest_click` | Future typeahead |
| `filter_change` | Search/hub filters |
| `menu_types_click` | Types menu link |
| `menu_cities_click` | Cities menu link |
| `breadcrumb_click` | Breadcrumb segment |
| `footer_click` | Footer link (with column prop) |
| `related_nav_click` | Nearby/similar/blog/program module |
| `cta_header_claim_click` | Header claim CTA |
| `cta_header_login_click` | Owner login |
| `cta_sticky_mobile_click` | Sticky bar action type |
| `hub_child_click` | In-hub child navigation |

Properties: `surface=public|owner|admin`, label/href, hub/institution ids when relevant. No PII.

---

## 15. Accessibility

| Area | Requirement |
| --- | --- |
| **Keyboard** | Tab through logo → search → primary → CTA; menus open via Enter/Space; Esc closes |
| **Focus order** | Matches visual order; skip link to `#main` |
| **ARIA** | `nav` landmarks (primary/footer); menu buttons `aria-expanded`; mobile drawer dialog pattern |
| **Screen readers** | Current page indicated; breadcrumb nav labeled; icon-only buttons have accessible names (“Menüyü aç”, “Ara”) |
| **Sticky CTA** | Does not trap focus; still reachable; doesn’t obscure focused content without scroll padding |
| **Mega-menus** | Pointer and keyboard operable; not hover-only |

WCAG 2.2 AA applies to all navigation chrome.

---

## 16. Navigation matrix (public quick reference)

| From | User can go to |
| --- | --- |
| Any public page | Home, Search, Types, Cities, Claim, Login, Contact/About |
| City hub | Districts, city×type, institutions |
| District hub | District×type, institutions, parent city |
| Type hub | Cities, institutions |
| Institution | Lead/call, claim, hubs via breadcrumbs, nearby/similar |
| Search | Institutions, clear filters, matching hubs |

---

## 17. MVP acceptance checklist

- [ ] Desktop header includes Logo, Search, Types, Cities, Claim CTA, Owner Login  
- [ ] Universities/Blog hidden or live only when real  
- [ ] Mobile: search ≤ 1 tap; drawer contains full primary set  
- [ ] Institution sticky mobile CTA = Call + Bilgi Al  
- [ ] Breadcrumbs on hubs + institution match URL ancestry  
- [ ] Footer columns capped; legal present; no empty hubs  
- [ ] Related modules present on institution profiles  
- [ ] Owner/Admin nav matches `ROUTES.md` and role visibility  
- [ ] Navigation analytics events defined above are implementable  

---

## 18. Approval

| Role | Name | Date | Sign-off |
| --- | --- | --- | --- |
| Product | | | ☐ |
| Design / UX | | | ☐ |
| SEO | | | ☐ |
| Engineering | | | ☐ |

**Summary:** EduAtlas navigation is **search-first and hub-deep** for parents, **claim-and-inbox-first** for owners, and **queue-first** for admins—with breadcrumbs and related links reinforcing the SEO graph, CTAs optimized for leads on profiles, and accessible, measurable menus across desktop and mobile.
