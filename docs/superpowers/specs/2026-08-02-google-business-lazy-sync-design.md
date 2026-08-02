# PRD-GOOGLE-001 — Google Business Lazy Sync Design

| Field | Value |
| --- | --- |
| **Date** | 2026-08-02 |
| **Status** | Approved |

## Behavior

- Lazy sync only: no bulk Places calls for the catalog.
- On real user institution profile views (`after()`), if sync is due → Places Text/Details → Firestore.
- Bots, prefetch, and crawlers must not trigger sync.
- Cache: skip Places when `lastSyncedAt` within 90 days and status is synced (unless force / rematch).
- Retry: fail → +7d → +30d → wait for manual.
- Field Mask only: id, displayName, formattedAddress, rating, userRatingCount, googleMapsUri, websiteUri, photos.
- Never store review text / reviewer PII.

## Snapshot fields

`placeId`, `placeName`, `formattedAddress`, `rating`, `reviewCount`, `mapsUrl`, `businessUrl`, `photoReferences`, `confidenceScore`, `matchMethod`, `syncStatus`, `lastSyncedAt`, `lastError`, `retryCount`, `nextRetryAt`

## Admin

- “Google Bilgilerini Güncelle” — force refresh details (keep placeId if present).
- “Google Eşleşmesini Yeniden Ara” — clear placeId and re-run search match.

## Non-goals

Bulk sync, premium cadence, showing Google review bodies, SEO/schema changes.
