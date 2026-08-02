# Campaign Delivery Engine (OUTREACH-003) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Firestore-backed DeliveryJob queue and single-instance worker so admins can Prepare → Approve → Run a warm-up batch (default 20) of claim-invite emails via Hostinger SMTP with rate/daily limits, retry, pause/resume, and progress UI.

**Architecture:** New `delivery` domain (channel-agnostic `DeliveryJob`) + application worker/handlers; outreach orchestration adds Prepare/Approve/Run; Firebase adapters persist campaigns/recipients/jobs/logs; admin `/admin/outreach` gains delivery controls. EMDS/builder preview/test-send unchanged (test mail bypasses DeliveryJob).

**Tech Stack:** TypeScript, Vitest, Firestore Admin, existing `EmailService`/`SmtpEmailService`, Next.js server actions, `@eduatlas/ui` admin page.

**Spec:** `docs/superpowers/specs/2026-08-02-campaign-delivery-engine-design.md`

## Global Constraints

- Production persistence: **Firestore only** (in-memory stores = unit tests).
- Warm-up default **20**; rate **10/min**; daily **100** — all config-driven.
- At most **one** campaign `running`.
- Approve required before Run; no job send before Approve+Run.
- Test email does **not** use DeliveryJob queue.
- Do not modify EMDS shells, Template/Segment models, Claim/Lead/Google Sync.
- Webhooks / real delivered-opened-clicked → OUTREACH-004.
- Typecheck must pass.

## File map

| Path | Responsibility |
| --- | --- |
| `packages/domain/src/delivery/*` | DeliveryJob aggregate, statuses, idempotency key helper |
| `packages/domain/src/outreach/campaign-status.ts` | Add `failed` |
| `packages/domain/src/outreach/campaign-recipient-status.ts` | Add `sending` |
| `packages/domain/src/outreach/campaign-recipient.ts` | Optional smtp* fields on recipient (or keep smtp only on job — **prefer job-only**) |
| `packages/application/src/delivery/*` | Config, repos ports, classifySmtpError, EmailDeliveryHandler, DeliveryWorker, InMemoryDeliveryJobRepository |
| `packages/application/src/outreach/prepare-campaign.ts` | Segment match + warm-up + recipient/job create |
| `packages/application/src/outreach/outreach-service.ts` | approve, run (single running), pause/resume, progress, wire prepare |
| `packages/config/src/env.ts` | Outreach delivery env keys |
| `packages/firebase/src/outreach/*` | Firestore campaign/recipient/log/job repositories |
| `apps/web/src/server/outreach/*` | Switch builder to Firestore; worker tick action |
| `packages/ui/src/admin/admin-outreach-page.tsx` | Prepare/Approve/Run/Pause/Resume + progress + review list |

---

### Task 1: Domain — DeliveryJob + status extensions

**Files:**
- Create: `packages/domain/src/delivery/delivery-job-status.ts`
- Create: `packages/domain/src/delivery/delivery-job.ts`
- Create: `packages/domain/src/delivery/delivery-idempotency.ts`
- Create: `packages/domain/src/delivery/index.ts`
- Modify: `packages/domain/src/outreach/campaign-status.ts` — add `Failed: "failed"`
- Modify: `packages/domain/src/outreach/campaign-recipient-status.ts` — add `Sending: "sending"`
- Modify: `packages/domain/src/index.ts` — export delivery
- Test: `packages/domain/src/delivery/delivery.test.ts`

**Interfaces:**
```ts
export const DeliveryJobStatus = Object.freeze({
  Pending: "pending",
  Locked: "locked",
  Sent: "sent",
  Failed: "failed",
  Bounced: "bounced",
  Cancelled: "cancelled",
} as const);

export function buildDeliveryIdempotencyKey(input: {
  campaignId: string;
  institutionId: string;
  channel: CampaignChannel;
}): string; // `${campaignId}:${institutionId}:${channel}`

export function createDeliveryJob(input: CreateDeliveryJobInput): DeliveryJob;
```

- [ ] **Step 1:** Failing tests for createDeliveryJob validation, idempotency key, failed campaign status parse, sending recipient status
- [ ] **Step 2:** Implement domain types
- [ ] **Step 3:** `npx vitest run packages/domain/src/delivery packages/domain/src/outreach` — PASS
- [ ] **Step 4:** Commit `Add DeliveryJob domain and campaign status extensions.`

---

### Task 2: Delivery config + SMTP error classification

**Files:**
- Create: `packages/application/src/delivery/delivery-config.ts`
- Create: `packages/application/src/delivery/classify-smtp-error.ts`
- Modify: `packages/config/src/env.ts` (+ tests) — optional typed getters; or read via `delivery-config` from `process.env` with defaults (match existing SMTP env style in web)
- Test: `packages/application/src/delivery/classify-smtp-error.test.ts`

**Interfaces:**
```ts
export type OutreachDeliveryConfig = Readonly<{
  warmupBatchSize: number;      // default 20
  ratePerMinute: number;        // 10
  dailySendLimit: number;       // 100
  retryDelayMs: number;         // 3_600_000
  maxAttempts: number;          // 3
  workerInstanceId: string;
  lockTtlMs: number;            // 300_000
}>;

export function loadOutreachDeliveryConfig(
  env?: NodeJS.ProcessEnv,
): OutreachDeliveryConfig;

export type SmtpFailureClass = "hard_bounce" | "transient" | "unknown";

export function classifySmtpError(error: unknown): SmtpFailureClass;
```

Hard bounce heuristics (substring match, case-insensitive): `user unknown`, `mailbox unavailable`, `invalid recipient`, `550 5.1.1`, `551`, `553`, `recipient rejected`.  
Transient: `timeout`, `421`, `450`, `451`, `452`, `try again`, `greylist`, `connection`.  
Else `unknown` → treat as transient for retry (safer than permanent drop).

- [ ] **Step 1:** Failing classification + config default tests
- [ ] **Step 2:** Implement
- [ ] **Step 3:** PASS + Commit `Add outreach delivery config and SMTP error classification.`

---

### Task 3: DeliveryJobRepository port + in-memory + worker core

**Files:**
- Create: `packages/application/src/delivery/delivery-job-repository.ts`
- Create: `packages/application/src/delivery/in-memory-delivery-job-repository.ts`
- Create: `packages/application/src/delivery/delivery-channel-handler.ts`
- Create: `packages/application/src/delivery/email-delivery-handler.ts`
- Create: `packages/application/src/delivery/delivery-worker.ts`
- Create: `packages/application/src/delivery/delivery-send-budget.ts` — minute + daily counters (in-memory for tests; Firestore counter doc for prod in Task 5)
- Create: `packages/application/src/delivery/index.ts`
- Modify: `packages/application/src/index.ts`
- Test: `packages/application/src/delivery/delivery-worker.test.ts`

**Interfaces:**
```ts
export interface DeliveryJobRepository {
  getById(id: string): Promise<DeliveryJob | null>;
  getByIdempotencyKey(key: string): Promise<DeliveryJob | null>;
  save(job: DeliveryJob): Promise<DeliveryJob>; // throws if idempotency conflict
  update(job: DeliveryJob): Promise<DeliveryJob>;
  listByCampaignId(campaignId: string): Promise<readonly DeliveryJob[]>;
  /**
   * Atomically claim next eligible pending job for a running campaign.
   * Reclaims locks older than lockTtlMs.
   */
  claimNext(input: {
    now: string;
    lockedBy: string;
    lockTtlMs: number;
    campaignId: string;
  }): Promise<DeliveryJob | null>;
}

export type DeliverySendResult = Readonly<{
  outcome: "accepted" | "hard_bounce" | "transient_failure";
  smtpMessageId?: string;
  smtpResponse?: string;
  smtpCode?: string;
  errorMessage?: string;
}>;

export interface DeliveryChannelHandler {
  readonly channel: CampaignChannel;
  send(input: {
    job: DeliveryJob;
    recipient: CampaignRecipient;
    campaign: Campaign;
    now: string;
  }): Promise<DeliverySendResult>;
}

export interface DeliveryWorker {
  tick(now: string): Promise<{ processed: number }>;
}

export function createDeliveryWorker(deps: {
  config: OutreachDeliveryConfig;
  jobRepository: DeliveryJobRepository;
  campaignRepository: CampaignRepository;
  recipientRepository: CampaignRecipientRepository;
  handlers: readonly DeliveryChannelHandler[];
  budget: DeliverySendBudget;
  log?: (message: string, meta?: Record<string, string>) => Promise<void>;
}): DeliveryWorker;
```

**Worker tick algorithm:**
1. Find the single `running` campaign (if none, return 0).
2. While budget allows (rate/minute + daily): `claimNext` → mark recipient `sending` → `handler.send` → update job+recipient; on transient reschedule `pending`+`availableAt`; on hard bounce `bounced`; on accepted `sent` + record budget.
3. If no actionable jobs left → mark campaign `completed`.

`EmailDeliveryHandler`: load template via campaign; `renderClaimInvitationMail` / existing render path; `emailService.send`; map errors via `classifySmtpError`.

- [ ] **Step 1:** Failing tests — claim lock, rate limit stops, retry schedule, hard bounce no retry, complete campaign, test that handler is invoked once per tick job
- [ ] **Step 2:** Implement in-memory repos + worker
- [ ] **Step 3:** PASS + Commit `Add DeliveryWorker with rate limits, lock, and retry.`

---

### Task 4: Outreach Prepare / Approve / Run / Progress

**Files:**
- Create: `packages/application/src/outreach/prepare-campaign.ts`
- Create: `packages/application/src/outreach/campaign-progress.ts`
- Modify: `packages/application/src/outreach/outreach-service.ts`
- Modify: `packages/application/src/outreach/index.ts`
- Test: `packages/application/src/outreach/outreach-delivery.test.ts`

**Interfaces:**
```ts
prepareCampaign(input: {
  campaignId: string;
  now: string;
  institutionRepository: InstitutionRepository;
  config: OutreachDeliveryConfig;
}): Promise<{ recipientCount: number; skippedDuplicates: number }>;
// Requires campaign.status === draft; segment loaded; list institutions by cityId filter then institutionMatchesSegment; slice(0, warmupBatchSize);
// For each: skip if recipient or job idempotency exists; else save recipient (queued) + DeliveryJob (pending, availableAt=now) BUT worker must also require campaign.running — pending jobs idle until Run.

approveCampaign(campaignId, now): Promise<Campaign>; // draft → ready only if recipients.length > 0
runCampaign(campaignId, now): Promise<Campaign>; // ready|paused → running; reject if another running; reject if not ready/paused
getCampaignProgress(campaignId): Promise<CampaignProgress>;
```

```ts
type CampaignProgress = {
  total: number;
  sent: number;
  queued: number; // pending+locked jobs or queued/sending recipients
  failed: number;
  bounced: number;
  percent: number; // sent/total * 100
};
```

Keep `sendTestEmail` **without** writing DeliveryJobs.

Extend `OutreachServiceDependencies` with `deliveryJobRepository` + optional `institutionRepository` for prepare (or prepare as standalone function called from actions).

- [ ] **Step 1:** Failing prepare cap/idempotency/approve/run-single/progress tests
- [ ] **Step 2:** Implement
- [ ] **Step 3:** PASS + Commit `Add campaign prepare, approve, run, and progress.`

---

### Task 5: Firestore adapters + web wiring

**Files:**
- Create: `packages/firebase/src/outreach/firestore-campaign-repository.ts` (+ document store/mapper as needed)
- Create: `packages/firebase/src/outreach/firestore-campaign-recipient-repository.ts`
- Create: `packages/firebase/src/outreach/firestore-campaign-log-repository.ts`
- Create: `packages/firebase/src/outreach/firestore-delivery-job-repository.ts` — doc id = sanitized idempotency key; `claimNext` via transaction
- Create: `packages/firebase/src/outreach/firestore-delivery-budget-store.ts` — daily counter doc `outreach_delivery_budget/{yyyy-mm-dd}`
- Create: `packages/firebase/src/outreach/index.ts`
- Modify: `packages/firebase/src/index.ts` exports
- Modify: `apps/web/src/server/outreach/store.ts` — use Firestore repos when Admin SDK available; keep in-memory only if explicitly testing (prefer always Firestore in web)
- Create: `apps/web/src/server/outreach/delivery-worker.ts` — factory + `tickOutreachDelivery()`
- Modify: `apps/web/src/server/admin/outreach-actions.ts` — prepare/approve/run/pause/resume/tick actions
- Modify: `apps/web/src/server/admin/get-admin-outreach.ts` — progress + prepared recipient list for review
- Seed templates/segments: keep `ensureOutreachSeeds` but persist templates/segments in Firestore **or** keep seed templates in Firestore collections `outreach_templates` / `outreach_segments`

**Collections (suggested):**
- `outreach_campaigns/{campaignId}`
- `outreach_recipients/{recipientId}` (+ indexes campaignId, institutionId)
- `outreach_delivery_jobs/{idempotencyKeySanitized}`
- `outreach_campaign_logs/{logId}`
- `outreach_templates/{id}`, `outreach_segments/{id}`
- `outreach_delivery_budget/{day}`

- [ ] **Step 1:** Implement Firestore repos (follow `firestore-lead-repository` pattern)
- [ ] **Step 2:** Wire web store + actions; on Run success call `after(() => tickOutreachDelivery())` and expose manual “İşle (tick)” for admin
- [ ] **Step 3:** Typecheck firebase + web
- [ ] **Step 4:** Commit `Wire Firestore outreach delivery repositories and admin actions.`

---

### Task 6: Admin UI — delivery controls + progress

**Files:**
- Modify: `packages/ui/src/admin/admin-outreach-page.tsx`
- Modify: `packages/ui/src/styles/admin.css` (progress strip)
- Modify: `apps/web/src/app/admin/outreach/page.tsx`

**UI additions:**
- Buttons: Prepare, Approve (confirm), Run (confirm), Pause, Resume, Worker tick
- Review table: institution name/email/status for prepared recipients
- Progress: Total / Sent / Queued / Failed / Bounce / %
- Hide Run until status `ready`; hide Prepare if already prepared (recipients > 0) unless empty draft
- Keep preview + test send

- [ ] **Step 1:** Implement UI + props
- [ ] **Step 2:** Typecheck ui + web
- [ ] **Step 3:** Commit `Add admin delivery controls and campaign progress UI.`

---

### Task 7: Spec acceptance + verify

**Files:**
- Modify: `docs/superpowers/specs/2026-08-02-campaign-delivery-engine-design.md` — check acceptance boxes

- [ ] Run vitest for domain delivery, application delivery, outreach-delivery, firebase outreach if present
- [ ] `npm run typecheck` for domain, application, firebase, ui, web, config
- [ ] Confirm test email path still does not create DeliveryJobs
- [ ] Commit `Mark campaign delivery engine acceptance criteria complete.`

---

## Spec coverage

| Requirement | Task |
| --- | --- |
| DeliveryJob Firestore queue | 1, 3, 5 |
| Worker + lock + idempotency | 3, 4, 5 |
| Rate + daily + warm-up config | 2, 3, 4 |
| Retry / hard bounce | 2, 3 |
| Prepare → Approve → Run | 4, 6 |
| Pause / resume / single running | 4, 6 |
| Progress UI | 4, 6 |
| Hostinger SMTP + smtp* fields | 3, 5 |
| Test mail bypass queue | 4 |
| No EMDS/builder/template/segment model breaks | all |

## Risk notes

- Firestore `claimNext` must be transactional to honor single-worker + future multi-worker interface.
- Sanitized idempotency key as document id: replace `/` and other illegal chars.
- Extending `SmtpEmailService` to return `smtpResponse`/`smtpCode` if not already on `SendEmailResult` — extend result type in Task 3 if needed without breaking callers.
