# PRD-SEO-008 — CollectionPage & ItemList Design

| Field | Value |
| --- | --- |
| **Date** | 2026-08-02 |
| **Status** | Approved |

## Behavior

- Listing hubs (`city`, `district`, `category`, `city-type`) emit **CollectionPage** via SchemaEngine (plus existing BreadcrumbList).
- When the page passes a non-empty institution list (already loaded for render), CollectionPage.`mainEntity` is a single **ItemList** (`ItemListOrderAscending`, ListItem `position` / canonical `url` / `name`).
- Empty lists → CollectionPage only (no ItemList).
- No Firestore; pages pass `items` from their existing view data.
- Institution detail pages unchanged.

## Non-goals

Pagination, infinite scroll, sponsored/featured ranking, EducationalOrganization.
