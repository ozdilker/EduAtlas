# CollectionPage & ItemList Implementation Plan

> **For agentic workers:** Steps use `- [ ]` checkboxes for tracking.

**Goal:** Mark listing hubs as CollectionPage + optional ItemList via SchemaEngine.

**Architecture:** CollectionPageSchemaBuilder / ItemListSchemaBuilder; adapters for city, district, category, city-type; pages pass existing institution cards as `items`.

---

### Task 1: Builders + registry

- [x] ItemList + CollectionPage builders
- [x] Extend SchemaInputMap + adapters

### Task 2: Page SEO + web wiring

- [x] Page builders + MetadataEngine `items`
- [x] City/category/district/city-type JsonLd
- [x] Tests + typecheck
