# PRD-SEO-011 — WebSite SearchAction Design

| Field | Value |
| --- | --- |
| **Date** | 2026-08-02 |
| **Status** | Approved |

## Behavior

- `SearchActionSchemaBuilder` builds a static SearchAction from SiteConfig `searchPath` + `searchQueryParam`.
- Existing `WebSiteSchemaBuilder` sets `potentialAction` via SearchActionBuilder (no second WebSite / no separate JSON-LD graph).
- Template: `{origin}{searchPath}?{param}={search_term_string}` matching live `/search?q=`.
- Extensible later for other Action types via optional `potentialAction` override.

## Non-goals

Routing changes, new search URLs, Firestore, Institution/City/Category-specific SearchActions.
