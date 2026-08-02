# PRD-SEO-007 — Organization Schema Design

| Field | Value |
| --- | --- |
| **Date** | 2026-08-02 |
| **Status** | Approved |

## Behavior

- Expand `OrganizationSchemaBuilder` (home graph only via SchemaEngine).
- Description from home metadata input (same as WebSite).
- Optional contact/social/founding fields on `SeoSiteConfig` — omitted from JSON-LD when unset.
- `knowsAbout` typed constant list; `areaServed: "Turkey"`; `inLanguage` from locale.
- `alternateName`: shared EduAtlas tagline constant.
- WebSite publisher `@id` unchanged.

## Non-goals

EducationalOrganization, Firestore, routing/metadata/canonical changes.
