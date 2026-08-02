# PRD-OUTREACH-003 — Campaign Delivery Engine

| Field | Value |
| --- | --- |
| **Date** | 2026-08-02 |
| **Status** | Approved (conversation) |
| **Persistence** | Firestore (DeliveryJob queue + campaign/recipient delivery state) |
| **Architecture** | Delivery subdomain + outreach orchestration (Approach 1) |

## Goal

Prepared claim-invite campaigns are sent in a controlled, safe, measurable way: queue → single worker → SMTP → status updates, with pause/resume, rate/daily limits, retry, and hard-bounce handling.

Business target context: path toward first 500 claimed institutions. This PRD unlocks a safe first batch (warm-up capped, default **20**).

## Success criteria (v1 interpretation)

| Criterion | v1 meaning |
| --- | --- |
| First 20 institutions mailed safely | Prepare warm-up ≤ 20; Approve required before any job runs |
| Delivery Rate > 95% | **SMTP accepted** / attempted (not inbox delivery) |
| Hard Bounce < 2% | Permanent SMTP failures classified as `bounced` |
| Spam complaint ≈ 0 | Operational expectation; no complaint webhook in this PRD |
| Pause / resume | Admin can stop immediately; resume continues remaining jobs |

Provider webhook delivery/complaint tracking is **OUTREACH-004**.

## Non-goals

- Changing EMDS, Campaign Builder core UX (beyond delivery controls), Template, or Segment models
- Multi-worker / horizontal scale
- SMS / WhatsApp / Push send handlers (channels reserved on `DeliveryJob` only)
- Real inbox `delivered` / `opened` / `clicked` events
- Bulk “send everyone in segment” beyond warm-up batch
- Claim / Lead / Google Sync changes

## Philosophy

Never dump thousands of messages at once. Sends are gradual, config-gated, human-approved, and idempotent.

## Lifecycle

### Campaign flow

```
Draft → Prepare → Review → Approve → Run → (Pause ↔ Resume) → Completed | Failed
```

| Step | Behavior |
| --- | --- |
| **Prepare** | Match segment against Firestore institutions; take up to warm-up limit (default 20); create `CampaignRecipient` + `DeliveryJob`; apply duplicate/idempotency checks. Jobs are **not** executable until Approve+Run. |
| **Review** | Admin sees selected institutions + campaign summary (counts, subject, segment, limits). |
| **Approve** | Explicit admin confirmation; sets campaign to an approved/ready-to-run gate. No worker processing before this. |
| **Run** | Sets status `running` if no other campaign is `running`; worker may claim jobs. |
| **Pause** | Immediate: status `paused`; worker skips claiming for this campaign. Locked-in-flight job finishes or unlocks per lock TTL policy. |
| **Resume** | Back to `running` from remaining pending jobs. |
| **Completed** | No remaining actionable jobs (pending/locked/retryable). |
| **Failed** | Abort path (e.g. catastrophic / admin fail) — **add** `failed` to campaign status domain (keep existing `cancelled`). |

Domain today: `draft | ready | running | paused | completed | cancelled`.  
This PRD: introduce **`failed`**; use `ready` (or dedicated `approved`) as post-Approve pre-Run gate — prefer **`ready` = approved to run** after Prepare+Approve to avoid extra enum churn. Prepare may leave campaign in `draft` with recipients attached until Approve → `ready`.

Explicit rule: **Approve without Run does not send.** **Run without Approve is rejected.**

### Recipient status

Existing enum kept. Worker transitions used in v1:

`pending` → `queued` (at Prepare when job created) → `sending` (**add** if missing) → `sent` | `failed` | `bounced`

- `delivered` / `opened` / `clicked` / `claimed` / `unsubscribed`: remain in enum; **not produced** by Hostinger SMTP path.
- Hard bounce: `bounced`, no retry.
- Transient failure after max attempts: `failed`.

### DeliveryJob status

`pending` → `locked` → `sent` | `failed` | `bounced` | `cancelled`

Retry: transient failure returns job to `pending` with `availableAt = now + 1h`, `attemptCount++`, until `maxAttempts` (3).

## Delivery subdomain

### DeliveryJob (channel-agnostic)

```ts
DeliveryJob {
  id: string
  channel: "email" | "sms" | "whatsapp" | "push"
  campaignId: string
  recipientId: string
  institutionId: string
  status: "pending" | "locked" | "sent" | "failed" | "bounced" | "cancelled"
  idempotencyKey: string  // `${campaignId}:${institutionId}:${channel}`
  attemptCount: number
  maxAttempts: number     // default 3
  availableAt: string     // ISO
  lockedAt?: string
  lockedBy?: string       // worker instance id
  lastError?: string
  // Email SMTP diagnostics (channel === email)
  smtpMessageId?: string
  smtpResponse?: string
  smtpCode?: string
  createdAt: string
  updatedAt: string
}
```

Firestore: unique constraint / doc-id strategy on `idempotencyKey` (recommended doc id = stable hash or the key itself when safe).

### Ports

| Port | Role |
| --- | --- |
| `DeliveryJobRepository` | enqueue, getByIdempotencyKey, claimNext (transactional lock), update, listByCampaign |
| `DeliveryWorker` | `tick(now): Promise<{ processed: number }>` |
| `DeliveryChannelHandler` | `send(job, context): Promise<DeliverySendResult>` — v1 only `EmailDeliveryHandler` |

Single process worker implementation; interfaces allow future multi-worker. Claim uses Firestore transaction: only `pending` + `availableAt <= now` + campaign `running` + approved gate + rate/daily budget.

### In-memory OUTREACH-001 queue

`OutreachQueue` / `InMemoryOutreachQueue` remain for unit tests / legacy stub. **Production delivery uses Firestore `DeliveryJob` only.** Test email (`sendTestEmail`) continues to bypass DeliveryJob queue (OUTREACH-002 rule).

## Config (env / app config)

| Key | Default | Purpose |
| --- | --- | --- |
| `OUTREACH_WARMUP_BATCH_SIZE` | `20` | Max institutions created at Prepare |
| `OUTREACH_RATE_PER_MINUTE` | `10` | Worker send rate |
| `OUTREACH_DAILY_SEND_LIMIT` | `100` | Global daily accepted sends |
| `OUTREACH_RETRY_DELAY_MS` | `3600000` | 1 hour |
| `OUTREACH_MAX_ATTEMPTS` | `3` | Per job |
| `OUTREACH_WORKER_INSTANCE_ID` | hostname/random | `lockedBy` |
| `OUTREACH_LOCK_TTL_MS` | e.g. `300000` | Stale lock reclaim |

Warm-up and rate values are config-driven as required; no hard-coded “magic” beyond defaults.

## SMTP classification (v1)

- **Accepted** (`EmailService` success / provider accepted) → job `sent`, recipient `sent`; store `smtpMessageId`, `smtpResponse`, `smtpCode` when available.
- **Hard bounce class** (permanent): e.g. mailbox unavailable, user unknown, invalid recipient — job+recipient `bounced`; no retry.
- **Transient**: timeout, 4xx greylist, connection reset — retry schedule; after max attempts → `failed`.

Hostinger SMTP via existing `EmailService` / `SmtpEmailService`. No new HTML shell — render via existing EMDS claim invitation path.

## Parallelism rules

- At most **one** campaign in `running` at a time.
- Same campaign + institution + channel cannot get a second DeliveryJob (Prepare idempotency).
- Duplicate recipient rows for same campaign+institution rejected at Prepare.

## Admin UI (extend `/admin/outreach`)

- Prepare / Review list / Approve / Run / Pause / Resume controls (no silent auto-run).
- Progress: total, sent, queued (pending+locked), failed, bounced, percent.
- Confirmation step before Approve (and/or Run) so “RUN öncesi admin onayı” is explicit.
- Do not remove preview/test-send from OUTREACH-002.

## Worker hosting

Process-local single worker tick invoked from a safe server path (e.g. admin action + optional periodic `after()`/route tick while a campaign is `running`). Exactly one logical instance should claim (instance id + lock). No Cloud Tasks in this PRD.

## Persistence migration note

OUTREACH-002 process-local campaign store cannot back pause/resume/retry across deploys.

**Decision for this PRD:** production campaign, recipient, log, and DeliveryJob state live in **Firestore**. The in-memory outreach stores remain for **unit tests only**. Admin builder routes switch to Firestore-backed repositories (same UI). Prepare is the first write path that must be durable; drafts created in admin are also saved to Firestore so Prepare never bridges two stores.

## Testing

- Unit: Prepare caps at warm-up; idempotency; claim lock; rate/daily gates; retry delay; hard vs transient classification; single running campaign; test email does not create DeliveryJob.
- Typecheck all touched workspaces.
- No regression to EMDS / builder preview / claim invite transactional mail.

## Acceptance checklist

- [x] Queue (DeliveryJob Firestore) works
- [x] Worker tick works (single instance, interface-based)
- [x] Rate limit applied
- [x] Daily limit applied
- [x] Retry (1h, max 3) for transient SMTP
- [x] Pause / resume
- [x] Duplicate / idempotency at Prepare
- [x] Only one running campaign
- [x] Progress UI
- [x] Hostinger SMTP via EmailService
- [x] smtpMessageId / smtpResponse / smtpCode stored on success/failure when available
- [x] Test mail bypasses DeliveryJob queue
- [x] Typecheck passes; existing systems intact

## Follow-ups (OUTREACH-004+)

- Provider webhooks → real `delivered` / bounce / complaint
- Multi-worker
- SMS / WhatsApp / Push handlers
- Larger warm-up schedules beyond first 20
