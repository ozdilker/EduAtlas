# Growth Center Phase 1 Implementation Plan

> **For agentic workers:** Use subagent-driven-development or executing-plans. Steps use checkbox syntax.

**Goal:** Transform `/admin/outreach` into Growth Center without breaking domain lifecycle or delivery engine.

**Architecture:** UI + thin loaders/helpers on OUTREACH-002/003. Prepare stays draft; Approve → ready; Run when ready.

**Tech Stack:** Next.js admin page, server actions, `@eduatlas/application`, Vitest.

## Global Constraints

- Route `/admin/outreach` only.
- No new domain statuses.
- Prepare does not change status.
- Archive is UI filter only.
- No claim/premium ETA.
- EMDS / SMTP / delivery engine untouched.
- Phase 2 out of scope.

## Tasks

- [x] Spec + plan docs under `docs/superpowers/`
- [x] Pure helpers: quality score, list buckets, segment preview, live progress
- [x] Enrich `getAdminOutreachPageData`
- [x] Growth Center 3-panel shell + filtered list
- [x] Wizard steps 1–6
- [x] Wizard steps 7–10 + live delivery + audit
- [x] Regression tests

## Key files

- `packages/application/src/outreach/campaign-quality-score.ts`
- `packages/application/src/outreach/campaign-list-bucket.ts`
- `packages/application/src/outreach/preview-segment-institutions.ts`
- `packages/application/src/outreach/campaign-progress.ts`
- `packages/ui/src/admin/growth-center/*`
- `apps/web/src/server/admin/get-admin-outreach.ts`
