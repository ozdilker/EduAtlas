# EduAtlas — Component Inventory

| Field | Value |
| --- | --- |
| **Product** | EduAtlas |
| **Document** | COMPONENT-INVENTORY.md |
| **Version** | 1.0 |
| **Sprint** | Sprint-001 — Foundation |
| **Task** | Task-015 |
| **Status** | Binding inventory for Sprint-002 implementation |
| **Last updated** | 14 July 2026 |

---

## Document control

This document defines **every reusable UI component** in EduAtlas. It maximizes reuse across Public, Owner, and Admin surfaces and stays compatible with **Atlas CLI** generators (`atlas.config.json` → templates).

| Related document | Role |
| --- | --- |
| `DESIGN-SYSTEM.md` | Tokens, a11y, visual rules |
| `UI-ARCHITECTURE.md` | Screens composing these components |
| `NAVIGATION.md` | Header/footer/CTA behavior |
| `INSTITUTION-PROFILE-SPECIFICATION.md` | Profile modules |
| `ROUTES.md` | Link targets |
| `SYSTEM-ARCHITECTURE.md` | `packages/ui` + feature modules |

**Non-goals:** Implementation code, CSS, or React APIs as source code.

**Naming:** Components use PascalCase. Atlas CLI should scaffold from the **Name** column.

---

## 1. Purpose & rules

1. **Reuse first** — prefer extending a shared component over a one-off.  
2. **Composition** — feature components compose layout + shared primitives.  
3. **Tokens only** — no hard-coded one-off colors/spacing outside design system.  
4. **Surface-agnostic props** — density/theme variants (`public` \| `compact`) over forks.  
5. **CLI suitability** — each component has stable purpose, props contract, and states for generators.  
6. **Cards only when interactive** — per design system (e.g. `InstitutionCard`, not decorative wrappers).

### 1.1 Layers

| Layer | Package / location (logical) | Examples |
| --- | --- | --- |
| **Layout** | `packages/ui` layout | Header, Footer, Container |
| **Shared / System** | `packages/ui` | Modal, Button primitives*, Toast |
| **Feature** | `modules/*` + ui | Search*, Institution*, Leads*, Blog* |
| **Admin** | `modules/administration` + ui | AdminTable, AdminSidebar |
| **Owner Portal** | `modules/institution` portal ui | DashboardCard, LeadTable |

\*Button/Input primitives are implied by design system; listed under System when not named in the task. Sprint-002 should include base `Button`, `Input`, `Select`, `Textarea`, `Checkbox`, `Link` as **Foundation primitives** (§9).

### 1.2 Per-component contract fields

For each component below:

| Field | Meaning |
| --- | --- |
| Purpose | Why it exists |
| Responsibilities | What it does / does not do |
| Inputs | Data & callbacks (logical props) |
| Outputs | Events / slots emitted |
| States | Visual/interaction states |
| Accessibility | A11y requirements |
| Responsive | Breakpoint behavior |
| Reuse | Where else it applies |
| Atlas CLI | Generator suitability |

**CLI suitability scale:** `High` (template-ready) · `Medium` (needs feature context) · `Low` (highly bespoke).

---

## 2. Layout components

### 2.1 Header

| Field | Spec |
| --- | --- |
| **Purpose** | Public primary chrome: brand, search, nav, claim CTA, owner login |
| **Responsibilities** | Render nav IA per `NAVIGATION.md`; open mobile drawer; submit/focus search |
| **Inputs** | `navItems`, `showBlog`, `showUniversities`, `isAuthenticated`, `userRole`, `searchDefault` |
| **Outputs** | `onSearch`, `onNavigate`, `onClaimCta`, `onLogin`, `onMenuOpen` |
| **States** | default, scrolled (optional elevation), menuOpen, searchExpanded (mobile) |
| **Accessibility** | `banner` landmark; keyboard menus; aria-expanded on menu |
| **Responsive** | Full nav desktop; compact + drawer mobile |
| **Reuse** | All public pages; not owner/admin shells |
| **Atlas CLI** | **High** — `atlas gen layout header` |

### 2.2 Footer

| Field | Spec |
| --- | --- |
| **Purpose** | Public footer link hierarchy + legal |
| **Responsibilities** | Render capped columns (cities, types, popular, company, legal) |
| **Inputs** | `columns[]`, `legalLinks`, `brandNote` |
| **Outputs** | `onNavigate` (analytics-friendly) |
| **States** | default; column visibility flags |
| **Accessibility** | `contentinfo`; lists labeled |
| **Responsive** | Multi-column → stacked |
| **Reuse** | Public only; portals use `FooterMinimal` variant or prop `variant="minimal"` |
| **Atlas CLI** | **High** |

### 2.3 Sidebar

| Field | Spec |
| --- | --- |
| **Purpose** | Vertical nav for Owner or Admin shells |
| **Responsibilities** | Highlight active route; show badges (lead/claim counts); role-filter items |
| **Inputs** | `items[]` (label, href, icon, badge, roles), `activePath`, `collapsed` |
| **Outputs** | `onNavigate`, `onCollapse` |
| **States** | expanded, collapsed, activeItem, disabledItem |
| **Accessibility** | `navigation`; current page `aria-current` |
| **Responsive** | Persistent desktop; drawer on mobile |
| **Reuse** | Shared shell; configs differ Owner vs Admin (`AdminSidebar` may wrap this) |
| **Atlas CLI** | **High** |

### 2.4 Breadcrumb

| Field | Spec |
| --- | --- |
| **Purpose** | Hierarchical wayfinding + SEO trail display |
| **Responsibilities** | Render crumb list; last item current |
| **Inputs** | `items[]` `{label, href?}` |
| **Outputs** | `onCrumbClick` |
| **States** | default, single-item |
| **Accessibility** | `nav` labeled “Breadcrumb”; `aria-current="page"` |
| **Responsive** | Truncate middle on small screens with expand |
| **Reuse** | Public hubs/profile/blog; portal console breadcrumbs |
| **Atlas CLI** | **High** |

### 2.5 Container

| Field | Spec |
| --- | --- |
| **Purpose** | Max-width + gutter wrapper |
| **Responsibilities** | Apply `container.*` tokens |
| **Inputs** | `size`: sm\|md\|lg\|xl\|2xl`, `as` |
| **Outputs** | children only |
| **States** | — |
| **Accessibility** | No semantics unless `as` main/section |
| **Responsive** | Gutters scale per design system |
| **Reuse** | Universal |
| **Atlas CLI** | **High** |

### 2.6 Section

| Field | Spec |
| --- | --- |
| **Purpose** | Vertical page section with optional title/description |
| **Responsibilities** | Spacing rhythm; optional H2 |
| **Inputs** | `title`, `description`, `actions`, `id` (anchors) |
| **Outputs** | action slot events |
| **States** | default, flush |
| **Accessibility** | Heading hierarchy; section landmark when appropriate |
| **Responsive** | Stack title/actions on mobile |
| **Reuse** | Profile modules, hubs, portals |
| **Atlas CLI** | **High** |

---

## 3. Search components

### 3.1 SearchBar

| Field | Spec |
| --- | --- |
| **Purpose** | Composite search entry (input + submit + optional filters shortcut) |
| **Responsibilities** | Compose `SearchInput` + button; hero/header variants |
| **Inputs** | `variant`: hero\|header\|page`, `defaultQuery`, `placeholder` |
| **Outputs** | `onSubmit(query)` |
| **States** | idle, focused, submitting |
| **Accessibility** | Form label; submit button named “Ara” |
| **Responsive** | Hero stacks; header expands on mobile |
| **Reuse** | Home, Header, Search page |
| **Atlas CLI** | **High** |

### 3.2 SearchInput

| Field | Spec |
| --- | --- |
| **Purpose** | Controlled text field for queries |
| **Responsibilities** | Turkish-friendly input; clear button optional |
| **Inputs** | `value`, `placeholder`, `autoFocus`, `name` |
| **Outputs** | `onChange`, `onClear`, `onKeyDown` |
| **States** | empty, filled, disabled, error |
| **Accessibility** | AccName; clear button labeled |
| **Responsive** | Full width in compact layouts |
| **Reuse** | SearchBar, admin user search |
| **Atlas CLI** | **High** |

### 3.3 FilterPanel

| Field | Spec |
| --- | --- |
| **Purpose** | City / district / type (and future facets) controls |
| **Responsibilities** | Dependent district on city; emit filter model; mobile sheet mode |
| **Inputs** | `filters`, `options` (cities, districts, types), `layout`: sidebar\|sheet |
| **Outputs** | `onChange(filters)`, `onClear` |
| **States** | idle, dirty, applying |
| **Accessibility** | Group labels; sheet as dialog on mobile |
| **Responsive** | Sidebar ≥ md; bottom sheet on mobile |
| **Reuse** | `/search`, optional hub refinement |
| **Atlas CLI** | **Medium** — needs option data adapters |

### 3.4 FilterChip

| Field | Spec |
| --- | --- |
| **Purpose** | Compact toggle/removable filter token |
| **Responsibilities** | Selected/unselected visuals; dismiss |
| **Inputs** | `label`, `selected`, `dismissible` |
| **Outputs** | `onClick`, `onDismiss` |
| **States** | default, selected, disabled |
| **Accessibility** | Toggle button or `aria-pressed` |
| **Responsive** | Horizontal scroll row OK |
| **Reuse** | FilterPanel active filters, hub quick facets |
| **Atlas CLI** | **High** |

### 3.5 SortMenu

| Field | Spec |
| --- | --- |
| **Purpose** | Sort selection for results |
| **Responsibilities** | List sort options; show current |
| **Inputs** | `value`, `options[]` |
| **Outputs** | `onChange` |
| **States** | closed, open |
| **Accessibility** | Menu button pattern |
| **Responsive** | Full-width trigger on mobile |
| **Reuse** | Search results, admin lists (via props) |
| **Atlas CLI** | **High** |

### 3.6 ResultsHeader

| Field | Spec |
| --- | --- |
| **Purpose** | Results count + sort + optional view toggles |
| **Responsibilities** | Summarize “N kurum”; host SortMenu |
| **Inputs** | `count`, `querySummary`, `sort`, `sortOptions` |
| **Outputs** | `onSortChange` |
| **States** | loading count, zero |
| **Accessibility** | Status text available to SR on update |
| **Responsive** | Stack on small screens |
| **Reuse** | Search + hub institution lists |
| **Atlas CLI** | **High** |

---

## 4. Institution components

### 4.1 InstitutionCard

| Field | Spec |
| --- | --- |
| **Purpose** | Interactive result/related card for an institution |
| **Responsibilities** | Show name, type, location, snippet, badges, media thumb; navigate on activate |
| **Inputs** | `institution` (card DTO), `href`, `showFavorite` |
| **Outputs** | `onOpen`, `onFavoriteToggle`, `onCta` |
| **States** | default, hover, loading skeleton, premium |
| **Accessibility** | One primary link name; badges announced |
| **Responsive** | Full width mobile; grid cell desktop |
| **Reuse** | Search, hubs, nearby/similar |
| **Atlas CLI** | **High** |

### 4.2 InstitutionHero

| Field | Spec |
| --- | --- |
| **Purpose** | Profile above-the-fold identity + primary actions |
| **Responsibilities** | H1 name, logo/cover, badges, type/location, CTAs |
| **Inputs** | `institution`, `badges`, `actions` config |
| **Outputs** | `onLead`, `onCall`, `onWhatsApp`, `onClaim`, `onFavorite`, `onShare` |
| **States** | claimed/unclaimed, verified, premium, minimal-media |
| **Accessibility** | Single H1; controls labeled |
| **Responsive** | Stack media/actions; CTAs full width mobile |
| **Reuse** | Institution profile only (variant possible for preview) |
| **Atlas CLI** | **Medium** |

### 4.3 InstitutionGallery

| Field | Spec |
| --- | --- |
| **Purpose** | Image gallery + lightbox |
| **Responsibilities** | Thumbnails; open lightbox; keyboard next/prev |
| **Inputs** | `images[]` `{src, alt}`, `coverId` |
| **Outputs** | `onOpen`, `onNavigate` |
| **States** | empty (hide), loading, lightboxOpen |
| **Accessibility** | Dialog lightbox; focus trap; alts |
| **Responsive** | Swipeable strip mobile |
| **Reuse** | Public profile; read-only mode of owner gallery |
| **Atlas CLI** | **Medium** |

### 4.4 InstitutionFacts

| Field | Spec |
| --- | --- |
| **Purpose** | Quick facts grid |
| **Responsibilities** | Render only provided facts; omit empties |
| **Inputs** | `facts[]` `{label, value, href?}` |
| **Outputs** | link clicks |
| **States** | default, sparse |
| **Accessibility** | Definition list or labeled grid |
| **Responsive** | 2→3→4 columns |
| **Reuse** | Profile; optional admin preview |
| **Atlas CLI** | **High** |

### 4.5 InstitutionPrograms

| Field | Spec |
| --- | --- |
| **Purpose** | Programs summary or structured list |
| **Responsibilities** | List program cards/rows; CTA per program optional |
| **Inputs** | `mode`: summary\|list`, `programs[]`, `summaryText` |
| **Outputs** | `onProgramLead`, `onProgramOpen` |
| **States** | empty (hide), loading |
| **Accessibility** | List semantics; headings |
| **Responsive** | Stack rows |
| **Reuse** | Profile; future program hubs teasers |
| **Atlas CLI** | **Medium** |

### 4.6 InstitutionContact

| Field | Spec |
| --- | --- |
| **Purpose** | NAP + contact actions |
| **Responsibilities** | Phone, WhatsApp, email, website, copy address, directions |
| **Inputs** | `contact`, `address` |
| **Outputs** | `onCall`, `onWhatsApp`, `onEmail`, `onWebsite`, `onCopyAddress`, `onDirections` |
| **States** | partial contact, copied toast trigger |
| **Accessibility** | Links with clear names; copy button feedback |
| **Responsive** | Action buttons stack / wrap |
| **Reuse** | Profile; optional card footer compact variant |
| **Atlas CLI** | **High** |

### 4.7 InstitutionMap

| Field | Spec |
| --- | --- |
| **Purpose** | Map / directions region |
| **Responsibilities** | Show address; optional embed; directions CTA |
| **Inputs** | `address`, `coordinates?`, `embedEnabled` |
| **Outputs** | `onDirections` |
| **States** | no-coordinates fallback, loading embed |
| **Accessibility** | Map not sole address source; iframe titled |
| **Responsive** | Fixed aspect ratio; full width |
| **Reuse** | Profile; future branch list |
| **Atlas CLI** | **Medium** |

### 4.8 InstitutionCTA

| Field | Spec |
| --- | --- |
| **Purpose** | Lead-focused CTA cluster / sticky bar |
| **Responsibilities** | Primary Bilgi Al + secondary Call; sticky mobile mode |
| **Inputs** | `variant`: inline\|sticky`, `phone?`, `showWhatsApp` |
| **Outputs** | `onLead`, `onCall`, `onWhatsApp` |
| **States** | default, stickyVisible |
| **Accessibility** | Sticky not focus-trapping; labels |
| **Responsive** | Sticky only below `md` typically |
| **Reuse** | Profile; could embed in long hub pages later |
| **Atlas CLI** | **High** |

### 4.9 InstitutionStatistics

| Field | Spec |
| --- | --- |
| **Purpose** | Display key stats (students, teachers, founded, views—when allowed) |
| **Responsibilities** | Metric tiles; omit unknowns |
| **Inputs** | `stats[]` `{label, value}` |
| **Outputs** | — |
| **States** | empty hide |
| **Accessibility** | Textual values, not color-only |
| **Responsive** | Row wrap |
| **Reuse** | Profile; owner dashboard snippets |
| **Atlas CLI** | **High** |

### 4.10 InstitutionBadge

| Field | Spec |
| --- | --- |
| **Purpose** | Claimed / verified / premium / featured badge |
| **Responsibilities** | Semantic styling per design system; honest labels |
| **Inputs** | `type`: claimed\|verified\|premium\|featured\|custom`, `label?` |
| **Outputs** | — |
| **States** | — |
| **Accessibility** | Text label always |
| **Responsive** | Inline |
| **Reuse** | Cards, hero, admin tables |
| **Atlas CLI** | **High** |

---

## 5. Leads components

### 5.1 LeadForm

| Field | Spec |
| --- | --- |
| **Purpose** | Parent/student information request form |
| **Responsibilities** | Fields per PRD; consent; client validation; submit |
| **Inputs** | `institutionId`, `defaultProgramId?`, `variant`: inline\|modal`, `initialValues?` |
| **Outputs** | `onSubmit(payload)`, `onSuccess`, `onError` |
| **States** | idle, validating, submitting, success, error |
| **Accessibility** | Labeled fields; error associations; focus on first error |
| **Responsive** | Single column; large touch targets |
| **Reuse** | Profile, future program pages; modal via Dialog |
| **Atlas CLI** | **High** — generator form schema |

### 5.2 ContactCard

| Field | Spec |
| --- | --- |
| **Purpose** | Compact contact block (phone/email/WhatsApp) |
| **Responsibilities** | Present actions without full NAP section |
| **Inputs** | `contact` |
| **Outputs** | same as contact actions subset |
| **States** | partial |
| **Accessibility** | Named links |
| **Responsive** | Horizontal button group → stack |
| **Reuse** | Cards, hub sidebars, owner preview |
| **Atlas CLI** | **High** |

### 5.3 AppointmentForm

| Field | Spec |
| --- | --- |
| **Purpose** | Schedule visit / callback appointment (future-ready) |
| **Responsibilities** | Date/time prefs + contact fields; may wrap LeadForm intents |
| **Inputs** | `institutionId`, `slots?` |
| **Outputs** | `onSubmit` |
| **States** | idle, submitting, success (MVP: may be hidden) |
| **Accessibility** | Date inputs labeled |
| **Responsive** | Stack |
| **Reuse** | Profile alternate CTA later |
| **Atlas CLI** | **Medium** |

---

## 6. Blog components

### 6.1 BlogCard

| Field | Spec |
| --- | --- |
| **Purpose** | Article teaser card |
| **Responsibilities** | Title, excerpt, image, date; link to post |
| **Inputs** | `post` card DTO, `href` |
| **Outputs** | `onOpen` |
| **States** | default, loading |
| **Accessibility** | Linked title |
| **Responsive** | Grid |
| **Reuse** | Blog index, related on profile |
| **Atlas CLI** | **High** |

### 6.2 ArticleHeader

| Field | Spec |
| --- | --- |
| **Purpose** | Blog post header |
| **Responsibilities** | H1, meta, cover, breadcrumbs slot |
| **Inputs** | `title`, `publishedAt`, `author?`, `cover?` |
| **Outputs** | — |
| **States** | — |
| **Accessibility** | One H1 |
| **Responsive** | Cover full bleed optional within container |
| **Reuse** | Blog post template |
| **Atlas CLI** | **High** |

### 6.3 ArticleList

| Field | Spec |
| --- | --- |
| **Purpose** | List/grid of BlogCards + pagination slot |
| **Responsibilities** | Map posts; empty state |
| **Inputs** | `posts[]`, `layout`: list\|grid |
| **Outputs** | child card events |
| **States** | empty, loading |
| **Accessibility** | List |
| **Responsive** | Grid collapse |
| **Reuse** | `/blog`, admin preview |
| **Atlas CLI** | **High** |

---

## 7. Admin components

### 7.1 AdminTable

| Field | Spec |
| --- | --- |
| **Purpose** | Opinionated admin data table with EduAtlas defaults |
| **Responsibilities** | Columns, row selection optional, row actions |
| **Inputs** | `columns`, `rows`, `rowActions`, `loading` |
| **Outputs** | `onRowOpen`, `onAction` |
| **States** | loading, empty, error |
| **Accessibility** | Table headers; action menus keyboard |
| **Responsive** | Horizontal scroll / card-rows mode |
| **Reuse** | Institutions, users, leads lists |
| **Atlas CLI** | **High** — CRUD table generator |

### 7.2 AdminSidebar

| Field | Spec |
| --- | --- |
| **Purpose** | Admin nav configuration of `Sidebar` |
| **Responsibilities** | Role-filtered admin items + badges |
| **Inputs** | `role`, `badges` (claims, leads) |
| **Outputs** | nav events |
| **States** | per Sidebar |
| **Accessibility** | Inherited |
| **Responsive** | Inherited |
| **Reuse** | Admin layout only |
| **Atlas CLI** | **High** |

### 7.3 StatusBadge

| Field | Spec |
| --- | --- |
| **Purpose** | Lifecycle/status chip for ops (draft, published, pending, spam…) |
| **Responsibilities** | Map status → semantic color + label |
| **Inputs** | `status`, `labelMap?` |
| **Outputs** | — |
| **States** | — |
| **Accessibility** | Text label |
| **Responsive** | Inline |
| **Reuse** | Admin tables, owner lead status, claims |
| **Atlas CLI** | **High** |

### 7.4 DataTable

| Field | Spec |
| --- | --- |
| **Purpose** | Lower-level headless-ish table primitive |
| **Responsibilities** | Sorting UI hooks, pagination slot, generic cells |
| **Inputs** | `columns`, `data`, `sort`, `pagination` |
| **Outputs** | `onSort`, `onPageChange` |
| **States** | loading, empty |
| **Accessibility** | Proper `<table>` or ARIA grid |
| **Responsive** | Scroll container |
| **Reuse** | Base under AdminTable / LeadTable |
| **Atlas CLI** | **High** |

---

## 8. Owner portal components

### 8.1 DashboardCard

| Field | Spec |
| --- | --- |
| **Purpose** | Summary metric/action card on owner home |
| **Responsibilities** | Show KPI + link to section |
| **Inputs** | `title`, `value`, `hint`, `href`, `tone` |
| **Outputs** | `onOpen` |
| **States** | default, loading |
| **Accessibility** | Link/button name includes metric |
| **Responsive** | Grid 1→2→3 |
| **Reuse** | Owner home; possible admin KPI strip |
| **Atlas CLI** | **High** |

### 8.2 LeadTable

| Field | Spec |
| --- | --- |
| **Purpose** | Owner inbox table for leads |
| **Responsibilities** | List leads; status filter; open detail |
| **Inputs** | `leads[]`, `filterStatus`, `loading` |
| **Outputs** | `onOpenLead`, `onStatusChange` |
| **States** | empty (EmptyState), loading |
| **Accessibility** | Table + status controls labeled |
| **Responsive** | Card list on mobile |
| **Reuse** | Built on DataTable; admin may reuse with extra columns |
| **Atlas CLI** | **Medium** |

### 8.3 GalleryUploader

| Field | Spec |
| --- | --- |
| **Purpose** | Upload/reorder/delete institution media |
| **Responsibilities** | File picker; progress; set cover/logo; enforce caps |
| **Inputs** | `items[]`, `maxItems`, `accept`, `disabled` |
| **Outputs** | `onUpload`, `onReorder`, `onDelete`, `onSetCover` |
| **States** | idle, uploading, error, atCapacity |
| **Accessibility** | File input labeled; keyboard reorder strategy documented |
| **Responsive** | Dropzone full width |
| **Reuse** | Owner gallery; admin media tab |
| **Atlas CLI** | **Medium** |

### 8.4 ProgramEditor

| Field | Spec |
| --- | --- |
| **Purpose** | Create/edit institution programs |
| **Responsibilities** | Form fields for program; list existing |
| **Inputs** | `programs[]`, `editingId?` |
| **Outputs** | `onSave`, `onDelete` |
| **States** | viewing, editing, saving, empty |
| **Accessibility** | Form labels; confirm delete |
| **Responsive** | Stack forms |
| **Reuse** | Owner programs; admin institution edit |
| **Atlas CLI** | **Medium** |

---

## 9. System / shared components

### 9.1 Foundation primitives (required for Sprint-002)

| Component | Purpose | CLI |
| --- | --- | --- |
| **Button** | All button variants/sizes | High |
| **Input** | Text field | High |
| **Textarea** | Multi-line | High |
| **Select** | Native/custom select | High |
| **Checkbox** / **Radio** | Choices + consent | High |
| **Link** | In-app / external link styles | High |
| **Icon** | Icon wrapper | High |

Each follows design-system tokens; full prop matrices inherited from `DESIGN-SYSTEM.md`.

### 9.2 Modal

| Field | Spec |
| --- | --- |
| **Purpose** | Generic overlay shell |
| **Responsibilities** | Scrim, focus trap, close |
| **Inputs** | `open`, `title`, `size` |
| **Outputs** | `onClose` |
| **States** | open/closed |
| **Accessibility** | `role="dialog"`, aria-modal, Esc |
| **Responsive** | Full-screen sheet on xs optional |
| **Reuse** | Base for Dialog confirmations & LeadForm modal |
| **Atlas CLI** | **High** |

### 9.3 Dialog

| Field | Spec |
| --- | --- |
| **Purpose** | Opinionated confirm/alert dialog |
| **Responsibilities** | Title, body, primary/secondary actions |
| **Inputs** | `tone`, `confirmLabel`, `cancelLabel` |
| **Outputs** | `onConfirm`, `onCancel` |
| **States** | open, confirming |
| **Accessibility** | Initial focus on primary or cancel per destructive pattern |
| **Responsive** | Centered |
| **Reuse** | Admin reject claim, delete confirm |
| **Atlas CLI** | **High** |

### 9.4 Toast

| Field | Spec |
| --- | --- |
| **Purpose** | Transient feedback |
| **Responsibilities** | Queue messages; auto-dismiss |
| **Inputs** | `tone`, `message`, `duration` |
| **Outputs** | `onDismiss` |
| **States** | visible, exiting |
| **Accessibility** | `role="status"` or alert for errors |
| **Responsive** | Edge positioning safe-area |
| **Reuse** | Global |
| **Atlas CLI** | **High** |

### 9.5 Spinner

| Field | Spec |
| --- | --- |
| **Purpose** | Inline loading indicator |
| **Inputs** | `size`, `label` |
| **Accessibility** | aria-busy / polite label |
| **Atlas CLI** | **High** |

### 9.6 Skeleton

| Field | Spec |
| --- | --- |
| **Purpose** | Placeholder shapes for loading layouts |
| **Inputs** | `variant`: text\|card\|hero\|table-row`, `lines` |
| **Responsive** | Match target layout |
| **Reuse** | All surfaces |
| **Atlas CLI** | **High** |

### 9.7 Pagination

| Field | Spec |
| --- | --- |
| **Purpose** | Page controls for lists/hubs |
| **Inputs** | `page`, `pageCount`, `hrefBuilder?` |
| **Outputs** | `onPageChange` |
| **States** | first/last disabled |
| **Accessibility** | nav labeled; current page |
| **Responsive** | Compact numbers on mobile |
| **Atlas CLI** | **High** |

### 9.8 EmptyState

| Field | Spec |
| --- | --- |
| **Purpose** | No-data guidance |
| **Inputs** | `title`, `description`, `actionLabel`, `illustration?` |
| **Outputs** | `onAction` |
| **Reuse** | Search zero, no leads, no favorites |
| **Atlas CLI** | **High** |

### 9.9 ErrorState

| Field | Spec |
| --- | --- |
| **Purpose** | Segment/page error presentation |
| **Inputs** | `code?`, `title`, `description`, `primaryAction`, `secondaryAction` |
| **Outputs** | action callbacks |
| **Reuse** | error.tsx boundaries, inline panels |
| **Atlas CLI** | **High** |

---

## 10. Cross-cutting feature components (inventory completion)

These are required for Sprint-002 coherence though not always named in the task list:

| Component | Layer | Purpose | CLI |
| --- | --- | --- | --- |
| **MobileNavDrawer** | Layout | Public mobile menu | High |
| **OwnerTopBar** | Owner | Context + logout | High |
| **ClaimBanner** | Feature | Unclaimed profile CTA band | Medium |
| **FaqList** | Feature | Profile/hub FAQ accordion | High |
| **RelatedInstitutions** | Feature | Nearby/similar rails using InstitutionCard | Medium |
| **AuthForm** | Feature | Login/register fields composition | Medium |
| **FileDropzone** | Shared | Used by GalleryUploader | High |
| **ConfirmButton** | Shared | Button opening Dialog | High |

---

## 11. Composition map (examples)

### 11.1 Search page

```text
Container
  SearchBar
  FilterPanel + FilterChip row
  ResultsHeader (SortMenu)
  InstitutionCard[] | EmptyState | Skeleton
  Pagination
```

### 11.2 Institution profile

```text
Breadcrumb
InstitutionHero (+ InstitutionBadge)
InstitutionGallery
InstitutionFacts / InstitutionStatistics
InstitutionContact
InstitutionCTA + LeadForm
InstitutionMap
InstitutionPrograms
FaqList
RelatedInstitutions (InstitutionCard)
```

### 11.3 Owner leads

```text
Sidebar
  LeadTable (DataTable + StatusBadge)
  EmptyState
  Dialog (status / spam)
  Toast
```

### 11.4 Admin institutions

```text
AdminSidebar
  AdminTable / DataTable
  StatusBadge / InstitutionBadge
  Dialog (publish/reject)
```

---

## 12. Atlas CLI compatibility

| Requirement | Spec |
| --- | --- |
| Manifest | Each component listed here is a `componentId` (kebab or Pascal) |
| Generator stubs | Purpose, props table, states, a11y notes, story placeholder |
| Tokens | Import from design-system tokens only |
| Placement | Layout/Shared → `packages/ui`; Feature → module path; Admin/Owner → module overlays |
| Do not generate | One-off page sections without inventory entry — add here first |

**Suggested CLI commands (logical):**

```text
atlas gen component InstitutionCard
atlas gen component LeadForm --module leads
atlas gen layout Header
```

---

## 13. Sprint-002 build priority

| Priority | Components |
| --- | --- |
| **P0 Foundation** | Button, Input, Textarea, Select, Checkbox, Link, Container, Section, Toast, Spinner, Skeleton, Modal, Dialog, EmptyState, ErrorState, Pagination |
| **P0 Public discovery** | Header, Footer, Breadcrumb, SearchBar, SearchInput, FilterPanel, FilterChip, SortMenu, ResultsHeader, InstitutionCard, InstitutionBadge |
| **P0 Profile / leads** | InstitutionHero, InstitutionFacts, InstitutionContact, InstitutionCTA, InstitutionGallery, LeadForm, InstitutionMap (basic), FaqList, RelatedInstitutions |
| **P1 Owner** | Sidebar, DashboardCard, LeadTable, GalleryUploader, ProgramEditor, StatusBadge |
| **P1 Admin** | AdminSidebar, AdminTable, DataTable, StatusBadge |
| **P2** | Blog*, AppointmentForm, InstitutionPrograms rich, InstitutionStatistics, MobileNavDrawer polish |

---

## 14. Acceptance criteria

- [ ] Every task-listed component has a full contract in this doc  
- [ ] Foundation primitives explicitly included  
- [ ] No conflicting duplicates (AdminTable vs DataTable roles clear)  
- [ ] CLI suitability marked  
- [ ] Composition maps cover search, profile, owner leads, admin list  
- [ ] A11y + responsive notes present per component  

---

## 15. Approval

| Role | Name | Date | Sign-off |
| --- | --- | --- | --- |
| Design | | | ☐ |
| Engineering | | | ☐ |
| Product | | | ☐ |

**Summary:** EduAtlas’s reusable UI is inventoried in **Layout, Search, Institution, Leads, Blog, Admin, Owner, and System** layers—each with purpose, I/O, states, a11y, responsive behavior, reuse, and Atlas CLI suitability—so Sprint-002 can implement `packages/ui` and feature modules without inventing one-offs.
