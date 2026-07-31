# EduAtlas Performance & Scalability Budgets

This document captures the *development-time* Firestore read/write budgets and the architectural rules used to enforce them.

## Dev-time budgets (warn only)

Budgets are measured via `packages/firebase/src/monitoring/firestore-counter.ts` (AsyncLocalStorage) and asserted with:
- `packages/firebase/src/monitoring/budget.ts`
- `assertFirestoreReadsBudget("home" | "city" | "detail")`

Defaults:
- `home`: 10 Firestore reads per render
- `city`: 15 Firestore reads per render
- `detail`: 20 Firestore reads per render

Notes:
- Budgets are **warn-only in development** (`NODE_ENV === "development"`).
- Budgets are **no-op in production**.
- The counter currently measures reads/writes at the Firestore *document-store* adapter boundaries (not every individual query builder call).

## Architectural rules (keep query counts stable)

1. Avoid full catalog downloads for scoped pages (prefer `listByCityId`, `listByDistrictId`, `listByPrimaryType`).
2. Keep list/search pages using projections (fetch fewer fields than full public profiles).
3. Use request-scoped memoization (`React.cache()` via `requestCacheAsync`) inside a single render pass.
4. Prefer TTL caching for high-cardinality “listAll” queries that are shared by many requests.
5. Defer below-the-fold work with `Suspense`, so above-the-fold budgets are not polluted by gallery/related lists.

## Firestore index review (quick check)

Based on current server queries we rely on equality filters on single fields (no composite index needed) and one two-field equality query:

- `districts` query with `cityId == ...` and `slug == ...`:
  - Expected composite index: `(cityId ASC, slug ASC)`
  - Confirmed present in `firestore.indexes.json`.

