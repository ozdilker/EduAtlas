# PRD-SEO-009 — Breadcrumb Schema Design

| Field | Value |
| --- | --- |
| **Date** | 2026-08-02 |
| **Status** | Approved |

## Behavior

- `BreadcrumbSchemaBuilder` emits exactly one Schema.org `BreadcrumbList` per indexable page via SchemaEngine adapters.
- ListItem: `position`, `name` (visible label), `item` (CanonicalResolver URL). Current page crumbs include `item` too.
- Trails match existing hub/institution UI hierarchy (no UI changes).
- Home: single “Ana sayfa” crumb. Search (noindex): no breadcrumb.
- Legacy `buildBreadcrumbJsonLd` delegates to the builder.

## Non-goals

hreflang, alternate breadcrumbs, Breadcrumb UI, Firestore, Metadata/Canonical/Routing changes.
