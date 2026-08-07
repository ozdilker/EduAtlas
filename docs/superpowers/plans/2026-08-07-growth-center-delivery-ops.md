# Growth Center Delivery Ops (GROWTH-002) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Growth Center delivery production-ready: platform warm-up stages, incremental draft Expand, live progress polling + ETA, Cancel UI — without rewriting the delivery engine.

**Architecture:** Thin ops layer on OUTREACH-003. Platform stage in `site_settings/outreach_warmup`; Prepare becomes incremental up to stage limit; Growth Center polls progress while `running` and wires Cancel / Stage Yükselt / Expand.

**Tech Stack:** `@eduatlas/domain` + `@eduatlas/application` delivery/outreach, Firestore `site_settings`, Next.js server actions, Growth Center React client, Vitest.

## Global Constraints

- Route stays `/admin/outreach`.
- Domain campaign statuses unchanged; Prepare leaves `draft`.
- Expand Warm-up only when campaign is `draft`.
- Stage does not auto-promote; admin Stage Yükselt only.
- No manual Retry UI; soft-retry stays in worker.
- Do not change EMDS, Template, Segment, PayTR, SEO.
- Idempotency key remains `campaignId:institutionId:channel`.
- Job status strings stay `pending|locked|sent|failed|bounced|cancelled` (UI labels only).

---

## File map

**Create**
- `packages/application/src/outreach/warmup-stage.ts` — stage limits, `limitForStage(stage)`
- `packages/application/src/outreach/warmup-settings.ts` — get/update platform settings types + pure helpers
- `packages/application/src/outreach/warmup-settings-repository.ts` — port interface
- `packages/application/src/outreach/in-memory-warmup-settings-repository.ts`
- `packages/firebase/src/site/firestore-outreach-warmup-repository.ts` — `site_settings/outreach_warmup`
- `apps/web/src/app/admin/outreach/progress/route.ts` (or server action) — JSON progress + optional tick
- Tests for warmup + incremental prepare + ETA

**Modify**
- `packages/application/src/delivery/delivery-config.ts` — stage limit table (20/50/100/250)
- `packages/application/src/outreach/prepare-campaign.ts` — incremental prepare to target count
- `packages/application/src/outreach/outreach-service.ts` — expand, cancel job cleanup if needed, warmup deps
- `apps/web/src/server/outreach/store.ts` — wire warmup repo
- `apps/web/src/server/admin/outreach-actions.ts` — elevateStage, expandWarmup, cancel
- `apps/web/src/server/admin/get-admin-outreach.ts` — stage, ETA, remaining, capacity
- `packages/ui/src/admin/growth-center/*` — summary, live polling, Expand / Stage / Cancel buttons
- `packages/application/src/index.ts` — exports

---

### Task 1: Warm-up stage config + settings port (TDD)

**Files:** `warmup-stage.ts`, `warmup-settings.ts`, repository port + in-memory, `delivery-config.ts` stage ceilings

- [ ] Write failing tests for `limitForStage(1..4)` → 20/50/100/250
- [ ] Implement limits (override via env `OUTREACH_WARMUP_STAGE_LIMITS` optional JSON or keep constants + config object)
- [ ] Implement `OutreachWarmupSettings` type + `getDefaultWarmupSettings()`
- [ ] In-memory repository get/save + elevate appends history
- [ ] Export from application index
- [ ] Run tests — pass

### Task 2: Firestore warmup repository

**Files:** `packages/firebase/src/site/firestore-outreach-warmup-repository.ts`, firebase server exports

- [ ] Doc id `outreach_warmup` under `site_settings`
- [ ] getOrCreate default stage 1
- [ ] updateStage with history append
- [ ] Wire into web outreach store / a small `getWarmupSettingsRepository()`

### Task 3: Incremental prepare / Expand

**Files:** `prepare-campaign.ts`, `outreach-service.ts`, tests

- [ ] Change prepare to: target = `min(stageLimit, matched.length)`; create only missing institutions (idempotency skip)
- [ ] Allow prepare when recipients already exist if `count < target` (Expand path)
- [ ] Reject prepare/expand when campaign status ≠ `draft`
- [ ] `expandWarmup(campaignId)` service method = prepare with platform limit
- [ ] First-time Prepare uses same path
- [ ] Tests: draft expand adds up to limit; ready campaign rejected; duplicates skipped
- [ ] Run outreach-delivery tests — pass

### Task 4: Cancel jobs + server actions

**Files:** `outreach-service.ts` cancel path, `outreach-actions.ts`, delivery job repo cancel helpers if needed

- [ ] On cancel: set campaign `cancelled`; mark pending (and safely locked) jobs `cancelled` where supported
- [ ] Audit log already present — verify message
- [ ] Actions: `elevateOutreachWarmupStageAction`, `expandOutreachWarmupAction`, `cancelOutreachCampaignAction`
- [ ] Redirect back to `/admin/outreach?id=…`

### Task 5: Loader + progress API

**Files:** `get-admin-outreach.ts`, progress route or `getOutreachProgressAction`

- [ ] Load warmup settings into page data (stage, limit, history snippet)
- [ ] Summary fields: remaining jobs, ETA minutes = `ceil(remaining / ratePerMinute)`, warm-up stage
- [ ] Add `GET` or server action returning `{ progress, status, etaMinutes, stage }` and calling `tickOutreachDelivery` when status is `running`
- [ ] Unit test ETA helper

### Task 6: Growth Center UI

**Files:** `summary-panel.tsx`, `live-delivery.tsx`, `growth-center-page.tsx`, types, CSS

- [ ] Show Warm-up Stage + limit; Stage Yükselt button (confirm)
- [ ] Expand Warm-up on draft when `recipientCount < stageLimit`
- [ ] Cancel button when service allows (running/paused/ready per existing cancel rules)
- [ ] While `running`, `useEffect` interval 5s fetch progress endpoint and refresh counters/bar/ETA
- [ ] Labels: Queued, Locked/Processing, Sent, Failed, Bounce, Kalan, ETA
- [ ] Manual Worker tick remains as fallback

### Task 7: Acceptance

- [ ] `vitest` outreach + delivery green
- [ ] Typecheck application + ui (+ web if practical)
- [ ] Manual checklist: stage1 prepare≤20; elevate→expand on draft; approve→run; pause/resume; polling updates; cancel; no duplicate jobs
- [ ] Commit & push only when user requests

## Out of scope

- Domain `PROCESSING` status, job `startedAt`/`completedAt`
- Manual Retry, onSnapshot, multi-worker
- Changing idempotency to recipientId
