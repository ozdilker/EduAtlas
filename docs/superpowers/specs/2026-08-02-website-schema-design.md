# PRD-SEO-006 — WebSite Schema Design

| Field | Value |
| --- | --- |
| **Date** | 2026-08-02 |
| **Status** | Approved |

## Behavior

- Home graph: **Organization** (with `@id`) + **exactly one WebSite**
- WebSite via `WebSiteSchemaBuilder`; publisher = `{ "@id": organizationId }`
- Description = MetadataEngine / `buildHomePageSeo` home description (passed as input)
- `potentialAction` omitted unless future SearchAction node is supplied
- Site URL / `@id` base from `SeoSiteConfig` + `CanonicalResolver` (no hardcoded domain)
- Other pages: no WebSite node

## Non-goals

SearchAction payload, routing/metadata/canonical/Firestore changes, new json-ld helper functions.
