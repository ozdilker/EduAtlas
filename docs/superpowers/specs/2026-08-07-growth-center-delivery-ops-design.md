# PRD-GROWTH-002 — Growth Center Delivery Operations

| Field | Value |
| --- | --- |
| **Date** | 2026-08-07 |
| **Status** | Approved (conversation) |
| **Route** | `/admin/outreach` (Growth Center) |
| **Baseline** | OUTREACH-003 delivery engine + GROWTH-001 UI |

## Goal

Ship campaign mail to the first ~100 claimed institutions safely and controllably: warm-up stages, durable Firestore queue, lock, rate/daily limits, pause/resume, cancel, live progress.

## Success criteria

- First 20 institutions sendable under warm-up stage 1 rules
- No duplicate DeliveryJob for the same campaign + institution + channel
- Pause / Resume supported
- Progress observable near-real-time (~5s polling while `running`)

## Non-goals

- Rewriting EMDS, Campaign Builder, Template, Segment, PayTR, SEO
- Multi-worker horizontal scale
- Manual Retry UI (automatic soft-retry remains)
- Changing DeliveryJob domain status string values (`pending` stays; UI may label Queued)
- Auto-advancing warm-up stage
- Claim/premium forecasting as hard requirements (history may store 0 / omit)

## Philosophy

Do not rebuild the delivery engine. Harden **operations**: platform warm-up stage, incremental draft prepare (“Expand”), live progress + ETA, Cancel in Growth Center, stage audit history.

## Locked decisions

1. **Warm-up is campaign Prepare capped by platform stage limit.** Stages: 1→20, 2→50, 3→100, 4→250 (config/env overridable).
2. **Stage is platform-level** (`site_settings/outreach_warmup`). Every campaign Prepare uses current stage limit.
3. **No automatic stage promotion.** Admin raises stage explicitly (“Stage Yükselt”).
4. **Expand Warm-up** only on **`draft`** campaigns: adds recipients/jobs up to current stage limit (incremental prepare). Then Review → Approve → Run unchanged.
5. **Live progress:** ~5s polling while campaign `running`, including optional worker tick.
6. **Cancel** in UI: campaign → `cancelled`; cancel actionable pending/locked jobs; audit log. No manual Retry button.
7. **Domain campaign/job statuses preserved.** UI maps `pending`→Queued, `locked`→Locked/Processing label.

## Lifecycle (unchanged core)

```
draft → Prepare/Expand (stays draft, recipients+jobs)
     → Approve → ready
     → Run → running ↔ Pause/Resume
     → completed | cancelled | failed
```

Worker only claims jobs for the single `running` campaign.

## Platform warm-up settings

Firestore document: `site_settings/outreach_warmup`

```ts
{
  stage: 1 | 2 | 3 | 4;
  limits: { 1: 20, 2: 50, 3: 100, 4: 250 }; // or read from app config
  updatedAt: ISO;
  updatedBy?: string;
  history: Array<{
    at: ISO;
    fromStage: number;
    toStage: number;
    by?: string;
    note?: string;
  }>;
}
```

Default when missing: `stage: 1`.

**Stage Yükselt** admin action: `stage = min(4, stage + 1)`, append history entry, write CampaignLog-style audit (platform log or outreach audit).

## Prepare / Expand

### Prepare (first time)

- Require `draft` and `recipientCount === 0` (current rule) **or** unify under incremental API.
- Match segment; take up to `limit(stage)` institutions not already prepared for this campaign.
- Create `CampaignRecipient` + `DeliveryJob` with existing idempotency key `campaignId:institutionId:channel`.
- Campaign status remains `draft`.

### Expand Warm-up (incremental)

- Require `draft`.
- `target = limit(platformStage)`.
- If `existingRecipients.length >= target`, no-op / validation message.
- Else create up to `target - existing` new recipients/jobs (skip idempotent duplicates).
- Status stays `draft`; admin continues Review → Approve → Run.

Replace hard “Campaign already prepared” block with incremental prepare used by both first Prepare and Expand.

## Delivery engine (keep)

Already present and required to remain:

| Capability | Behavior |
| --- | --- |
| Firestore queue | `outreach_delivery_jobs` |
| Lock + TTL | `locked` + reclaim after `lockTtlMs` |
| Rate | `OUTREACH_RATE_PER_MINUTE` default 10 |
| Daily | `OUTREACH_DAILY_SEND_LIMIT` default 100 |
| Soft retry | +1h, max 3 attempts |
| Hard bounce | `bounced`, no retry |
| Pause/Resume | status gate on worker |
| SMTP | Hostinger via `EmailService` |

Config naming may expose aliases `emailsPerMinute` / `emailsPerDay` in UI/docs; env keys stay.

`OUTREACH_WARMUP_BATCH_SIZE` becomes **fallback** or is **replaced** by platform stage limit for Prepare (prefer stage document; config supplies the four stage ceilings).

## Progress & Summary (Growth Center)

While `running` (and optionally `paused` for static view):

| Metric | Source |
| --- | --- |
| Queued | jobs `pending` |
| Locked / Processing | jobs `locked` (single UI count; label “Locked/Processing”) |
| Sent / Failed / Bounce | job statuses |
| % | sent / total jobs |
| Kalan | total − sent − failed − bounced − cancelled |
| ETA | `ceil(kalan / ratePerMinute)` minutes (simple) |
| Warm-up Stage | platform `stage` + limit |
| Tahmini bitiş | now + ETA |

Polling: client interval ~5s → lightweight admin route/action returning progress + trigger `tickOutreachDelivery` when `running`.

## Cancel

- Wire existing `OutreachService.cancel` to Growth Center.
- Cancel pending (and reclaimable locked) jobs → `cancelled` where repository supports it.
- Audit: “Campaign cancelled.”

## Audit

| Action | Log |
| --- | --- |
| Run / Pause / Resume | existing |
| Cancel | existing service log + UI |
| Stage Yükselt | platform history + admin notice |
| Expand / Prepare | existing prepare log messages |
| Retry | automatic only (no extra admin action) |

Stage history stores recipient/sent/failed/bounce aggregates when elevating **if cheap to compute**; claim/premium optional zeros.

## API / UI surface

- Growth Center summary: stage, limit, remaining capacity for selected draft campaign, ETA when running
- Actions: Stage Yükselt (platform), Expand Warm-up (draft campaign), Cancel (running/paused/ready as allowed by service)
- Polling hook on wizard step 10 / Live Delivery panel

## Testing

- Incremental prepare respects stage limit and idempotency
- Expand rejected when not `draft`
- Stage elevate persists and changes subsequent prepare caps
- Progress ETA math unit-tested
- Existing delivery/outreach suites still pass
- `tsc` clean for touched packages

## Out of scope / later

- PROCESSING as distinct domain status
- Job `startedAt` / `completedAt` fields
- Idempotency key change to `recipientId`
- Firestore client onSnapshot
- Manual Retry failed jobs
