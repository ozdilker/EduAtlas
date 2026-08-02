# PRD-SEO-010 — EducationalOrganization Schema Design

| Field | Value |
| --- | --- |
| **Date** | 2026-08-02 |
| **Status** | Approved |

## Behavior

- Institution pages emit one JSON-LD node: `@type: ["EducationalOrganization", "LocalBusiness"]` via `EducationalOrganizationSchemaBuilder` + SchemaEngine.
- Description from MetadataEngine; URL/`@id` from CanonicalResolver; `parentOrganization` → EduAtlas Organization `@id`.
- Image: cover → logo → site `defaultImageUrl`.
- Optional: telephone, email, address, geo, sameAs (website only) — omitted when unset.
- No Review / FAQ / AggregateRating. No extra Firestore.

## Non-goals

OpeningHours, social profiles beyond website, Course/Program catalogs.
