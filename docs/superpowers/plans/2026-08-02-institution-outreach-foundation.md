# Institution Outreach Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build domain models and application OutreachService (ports + in-memory adapters + EMDS template preview + queue stub) with no real email send and no Firestore.

**Architecture:** Pure domain aggregates under `packages/domain/src/outreach/`; application ports/repos/queue/service under `packages/application/src/outreach/`. Templates render HTML only via EMDS. Claim/SMTP/Lead/Google Sync untouched.

**Tech Stack:** TypeScript, Vitest, existing `@eduatlas/domain` / `@eduatlas/application` patterns, EMDS (`mail-design`).

## Global Constraints

- Scope Option A: domain + application only — **no Firestore**.
- **No real mail send**; queue must not call SMTP/EmailService.
- Template HTML **must** use EMDS only (no new ad-hoc HTML shells).
- Channel enum starts with `email` but remains extensible.
- Do not modify Claim, Lead, Google Sync, or SMTP modules.
- Follow existing domain factory patterns (`createX`, frozen objects, parse enums).
- Export new public APIs from package `index.ts` files.

## File map

| Path | Role |
| --- | --- |
| `packages/domain/src/outreach/*.ts` | Status/channel enums, Campaign, Segment, Template, Recipient, Log factories |
| `packages/domain/src/outreach/index.ts` | Domain barrel |
| `packages/domain/src/index.ts` | Re-export outreach |
| `packages/application/src/outreach/*-repository.ts` | Ports |
| `packages/application/src/outreach/in-memory-*.ts` | In-memory adapters |
| `packages/application/src/outreach/outreach-queue.ts` | Queue port + in-memory |
| `packages/application/src/outreach/institution-matches-segment.ts` | Filter evaluation |
| `packages/application/src/outreach/render-campaign-template.ts` | EMDS preview |
| `packages/application/src/outreach/outreach-service.ts` | Use cases |
| `packages/application/src/outreach/outreach.test.ts` | Tests |
| `packages/application/src/index.ts` | Re-exports |

---

### Task 1: Domain enums + Campaign / Segment / Template / Recipient / Log

**Files:**
- Create: `packages/domain/src/outreach/campaign-status.ts`
- Create: `packages/domain/src/outreach/campaign-channel.ts`
- Create: `packages/domain/src/outreach/campaign-recipient-status.ts`
- Create: `packages/domain/src/outreach/campaign-id.ts`
- Create: `packages/domain/src/outreach/campaign.ts`
- Create: `packages/domain/src/outreach/campaign-segment.ts`
- Create: `packages/domain/src/outreach/campaign-template.ts`
- Create: `packages/domain/src/outreach/campaign-recipient.ts`
- Create: `packages/domain/src/outreach/campaign-log.ts`
- Create: `packages/domain/src/outreach/index.ts`
- Create: `packages/domain/src/outreach/outreach.test.ts`
- Modify: `packages/domain/src/index.ts`

**Interfaces:**
- Produces:
  - `CampaignStatus`, `CampaignChannel`, `CampaignRecipientStatus` (+ parse/is helpers)
  - `createCampaignId`, `createCampaign`, `createCampaignSegment`, `createCampaignTemplate`, `createCampaignRecipient`, `createCampaignLog`
  - Types: `Campaign`, `CampaignSegment`, `CampaignSegmentFilters`, `CampaignTemplate`, `CampaignRecipient`, `CampaignLog`

- [ ] **Step 1: Write failing domain tests**

```ts
import { describe, expect, it } from "vitest";
import {
  CampaignChannel,
  CampaignStatus,
  createCampaign,
  createCampaignRecipient,
  createCampaignSegment,
  createCampaignTemplate,
  CampaignRecipientStatus,
} from "./index";

describe("createCampaign", () => {
  it("creates a draft email campaign", () => {
    const c = createCampaign({
      id: "camp_1",
      name: "Istanbul unclaimed",
      status: CampaignStatus.Draft,
      channel: CampaignChannel.Email,
      templateId: "tpl_1",
      segmentId: "seg_1",
      createdAt: "2026-08-02T00:00:00.000Z",
      createdBy: "admin_1",
    });
    expect(c.status).toBe("draft");
    expect(c.channel).toBe("email");
  });
});

describe("createCampaignSegment", () => {
  it("stores filters", () => {
    const s = createCampaignSegment({
      id: "seg_1",
      name: "Istanbul unclaimed",
      filters: { cityId: "tr-34", hasEmail: true, verification: "unclaimed" },
      createdAt: "2026-08-02T00:00:00.000Z",
      updatedAt: "2026-08-02T00:00:00.000Z",
    });
    expect(s.filters.cityId).toBe("tr-34");
    expect(s.filters.hasEmail).toBe(true);
  });
});

describe("createCampaignRecipient", () => {
  it("defaults to pending", () => {
    const r = createCampaignRecipient({
      id: "rec_1",
      campaignId: "camp_1",
      institutionId: "inst_1",
      email: "school@example.com",
      createdAt: "2026-08-02T00:00:00.000Z",
      updatedAt: "2026-08-02T00:00:00.000Z",
    });
    expect(r.status).toBe(CampaignRecipientStatus.Pending);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run packages/domain/src/outreach/outreach.test.ts`

- [ ] **Step 3: Implement domain modules**

Status string values: `draft|ready|running|paused|completed|cancelled`.  
Channel: `email` (+ export type union allowing future channels as string enum members `sms|whatsapp|push` defined but unused).  
Recipient status: `pending|queued|sent|delivered|opened|clicked|claimed|failed|bounced|unsubscribed`.  
Validate ISO timestamps and required ids; freeze objects.  
`CampaignSegmentFilters` optional fields as in spec.  
`CampaignTemplate`: `subject`, `preview`, `bodyLines: readonly string[]` — no HTML field.  
`CampaignLog`: `level: info|warn|error`.

- [ ] **Step 4: Export from domain index + run tests PASS**

- [ ] **Step 5: Commit**

```bash
git commit -m "Add outreach domain models for campaigns and recipients."
```

---

### Task 2: Repository ports + in-memory adapters + OutreachQueue

**Files:**
- Create: `packages/application/src/outreach/campaign-repository.ts`
- Create: `packages/application/src/outreach/campaign-recipient-repository.ts`
- Create: `packages/application/src/outreach/campaign-segment-repository.ts`
- Create: `packages/application/src/outreach/campaign-template-repository.ts`
- Create: `packages/application/src/outreach/campaign-log-repository.ts`
- Create: `packages/application/src/outreach/in-memory-outreach-stores.ts`
- Create: `packages/application/src/outreach/outreach-queue.ts`
- Create: `packages/application/src/outreach/index.ts` (partial)

**Interfaces:**
```ts
export interface CampaignRepository {
  getById(id: string): Promise<Campaign | null>;
  save(campaign: Campaign): Promise<Campaign>;
  update(campaign: Campaign): Promise<Campaign>;
  list(): Promise<readonly Campaign[]>;
}

// Similar get/save/update/list (and listByCampaignId for recipients/logs)

export type OutreachQueueJob = Readonly<{
  readonly id: string;
  readonly campaignId: string;
  readonly recipientId: string;
  readonly channel: CampaignChannel;
  readonly createdAt: string;
  readonly availableAt: string;
}>;

export interface OutreachQueue {
  enqueue(job: Omit<OutreachQueueJob, "id"> & { id?: string }): Promise<OutreachQueueJob>;
  listReady(nowIso: string): Promise<readonly OutreachQueueJob[]>;
  acknowledge(jobId: string): Promise<void>;
}
```

- [ ] **Step 1: Write failing test for in-memory queue enqueue/listReady**

```ts
it("enqueues jobs without sending mail", async () => {
  const q = createInMemoryOutreachQueue();
  const job = await q.enqueue({
    campaignId: "camp_1",
    recipientId: "rec_1",
    channel: "email",
    createdAt: "2026-08-02T00:00:00.000Z",
    availableAt: "2026-08-02T00:00:00.000Z",
  });
  const ready = await q.listReady("2026-08-02T01:00:00.000Z");
  expect(ready.map((j) => j.id)).toContain(job.id);
});
```

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement ports + in-memory Map stores + queue**

Ensure `acknowledge` removes job. No EmailService import anywhere in outreach.

- [ ] **Step 4: PASS + Commit**

```bash
git commit -m "Add outreach repository ports, in-memory stores, and queue stub."
```

---

### Task 3: Segment matching + EMDS template render

**Files:**
- Create: `packages/application/src/outreach/institution-matches-segment.ts`
- Create: `packages/application/src/outreach/render-campaign-template.ts`
- Modify: `packages/application/src/outreach/outreach.test.ts` (or dedicated test file)

**Interfaces:**
```ts
export function institutionMatchesSegment(
  institution: Institution,
  segment: CampaignSegment,
): boolean;

export function renderCampaignTemplatePreview(
  template: CampaignTemplate,
): RenderedEmail; // uses renderEmailTemplate / EMDS
```

- [ ] **Step 1: Failing tests**

```ts
it("matches city and hasEmail filters", () => {
  // institution with cityId tr-34 and contact.email set
  expect(institutionMatchesSegment(inst, segment)).toBe(true);
});

it("renders preview via EMDS 600px shell", () => {
  const rendered = renderCampaignTemplatePreview(template);
  expect(rendered.html).toContain("max-width:600px");
  expect(rendered.html).toContain("#e62846");
});
```

- [ ] **Step 2: Implement**

Filter rules:
- undefined filter = ignore
- `hasEmail` / `hasWebsite` / `hasPhone` based on contact/socialLinks
- `verification` compared to `institution.verification`
- `googleRatingMin/Max` use `institution.googleBusiness?.rating` when present; if filter set and no rating → no match
- `isPremium` exact

`renderCampaignTemplatePreview` calls existing `renderEmailTemplate({ title: subject, preview, bodyLines })`.

- [ ] **Step 3: PASS + Commit**

```bash
git commit -m "Add segment matching and EMDS campaign template preview."
```

---

### Task 4: OutreachService use cases

**Files:**
- Create: `packages/application/src/outreach/outreach-service.ts`
- Create: `packages/application/src/outreach/errors.ts`
- Modify: `packages/application/src/outreach/index.ts`
- Modify: `packages/application/src/index.ts`
- Modify: `packages/application/src/outreach/outreach.test.ts`

**Interfaces:**
```ts
export type OutreachServiceDependencies = Readonly<{
  campaignRepository: CampaignRepository;
  recipientRepository: CampaignRecipientRepository;
  segmentRepository: CampaignSegmentRepository;
  templateRepository: CampaignTemplateRepository;
  logRepository: CampaignLogRepository;
  queue: OutreachQueue;
}>;

export class OutreachService {
  createCampaign(...): Promise<Campaign>;
  markReady(campaignId: string, now: string): Promise<Campaign>;
  pause(campaignId: string, now: string): Promise<Campaign>;
  resume(campaignId: string, now: string): Promise<Campaign>;
  cancel(campaignId: string, now: string): Promise<Campaign>;
  addRecipients(input: { campaignId; recipients: { institutionId; email }[]; now }): Promise<readonly CampaignRecipient[]>;
  enqueuePendingRecipients(campaignId: string, now: string): Promise<number>; // queued count; NO send
  previewTemplate(templateId: string): Promise<RenderedEmail>;
  markRecipientClaimed(input: { institutionId: string; claimedAt: string }): Promise<number>;
  countRecipientsByStatus(campaignId: string): Promise<Readonly<Record<string, number>>>;
}
```

Status transition rules:
- `draft` → `ready` only if template + segment exist
- `ready` → `running` optional helper OR leave running for later PRD; this PRD may set `running` when enqueue starts (document choice: **enqueuePending does not auto-run**; add `start(campaignId)` ready→running)
- `running` ↔ `paused`; `running|paused|ready` → `cancelled`; terminal: completed/cancelled

`markRecipientClaimed`: all recipients with matching institutionId and not already claimed → status claimed + claimedAt; return updated count. Does not call claim module.

Every transition writes a CampaignLog.

- [ ] **Step 1: Failing service tests** (create → ready → add recipients → enqueue → queue has jobs; claimed hook)

- [ ] **Step 2: Implement service**

- [ ] **Step 3: Typecheck application + run outreach + mail-design tests**

Run:
```
npx vitest run packages/application/src/outreach packages/domain/src/outreach
npm run typecheck --workspace=@eduatlas/domain
npm run typecheck --workspace=@eduatlas/application
```

- [ ] **Step 4: Commit**

```bash
git commit -m "Add OutreachService with queue enqueue and claim conversion hook."
```

---

### Task 5: Spec acceptance checkboxes

**Files:**
- Modify: `docs/superpowers/specs/2026-08-02-institution-outreach-foundation-design.md`

- [ ] Mark acceptance items complete after verification
- [ ] Commit: `docs: mark outreach foundation acceptance criteria complete`

---

## Spec coverage

| Requirement | Task |
| --- | --- |
| Campaign/Recipient/Segment/Template/Log models | 1 |
| EMDS templates | 3 |
| Queue, no send | 2 + 4 |
| Extensible channel | 1 |
| ClaimedAt hook | 4 |
| Google rating segment filter | 3 |
| No SMTP/Claim/Lead/Google Sync edits | all |

## Placeholder scan

None — signatures and status values specified.
