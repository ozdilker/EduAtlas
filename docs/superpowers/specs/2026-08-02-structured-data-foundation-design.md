# PRD-SEO-005 — Structured Data Foundation Design

| Field | Value |
| --- | --- |
| **Date** | 2026-08-02 |
| **Status** | Approved (C) |

## Approach

- Add `SchemaEngine` + `SchemaRegistry` + `SchemaBuilder` contract under `@eduatlas/seo`.
- Register **temporary adapters** that call existing `buildOrganizationJsonLd` / `buildWebsiteJsonLd` / `buildBreadcrumbJsonLd` (etc.).
- Page SEO builders obtain `jsonLd` only via `SchemaEngine` (no inline helper calls).
- Output identical to today; later PRDs replace adapters with real builders.
- Do not change MetadataEngine, Canonical, routing, Firestore, or web `JsonLd` component contract.

## Schema.org type constants

Typed `SchemaOrgType` const map for future builders (no magic strings in new code). Existing helpers unchanged.

## Non-goals

New schema payloads (FAQ, LocalBusiness, …), removing legacy helpers, rewriting page UI.
