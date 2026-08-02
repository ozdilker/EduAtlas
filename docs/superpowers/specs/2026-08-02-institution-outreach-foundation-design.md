# PRD-OUTREACH-001 — Institution Outreach Foundation

| Field | Value |
| --- | --- |
| **Date** | 2026-08-02 |
| **Status** | Approved (conversation) |
| **Scope** | Domain + Application only (Option A) — no Firestore, no real send |

## Goal

Foundation for EduAtlas institution outreach campaigns: reusable, measurable, pausable/cancellable campaigns targeting (initially) unclaimed Istanbul institutions. **No real email delivery in this PRD.**

## Non-goals

- SMTP / provider changes
- Claim / Lead / Google Sync behavior changes
- Admin UI / analytics dashboards
- Real queue workers that send mail
- SMS / WhatsApp / Push delivery (channel enum must remain extensible)
- Firestore persistence adapters

## Placement

| Layer | Path |
| --- | --- |
| Domain | `packages/domain/src/outreach/` |
| Application | `packages/application/src/outreach/` |

## Domain models

### Campaign

`id`, `name`, `description?`, `status`, `channel`, `templateId`, `segmentId`, `createdAt`, `createdBy`, `startedAt?`, `completedAt?`

**Status:** `draft` | `ready` | `running` | `paused` | `completed` | `cancelled`

**Channel:** `email` (reserved for later: `sms`, `whatsapp`, `push`)

### CampaignSegment

`id`, `name`, `description?`, `filters`, `createdAt`, `updatedAt`

**Filters (dynamic):** `cityId?`, `districtId?`, `primaryType?`, `verification?` / claim status, `isPremium?`, `hasEmail?`, `hasWebsite?`, `hasPhone?`, `googleRatingMin?`, `googleRatingMax?`

Helper: `institutionMatchesSegment(institution, segment)` — pure domain/application evaluation.

### CampaignTemplate

`id`, `name`, `subject`, `preview`, `bodyLines` (or structured slots), `createdAt`, `updatedAt`

No raw HTML stored. Rendering **must** go through EMDS (`renderMailDocument` / components).

### CampaignRecipient

`id`, `campaignId`, `institutionId`, `email`, `status`, `sentAt?`, `openedAt?`, `clickedAt?`, `claimedAt?`, `lastError?`, `createdAt`, `updatedAt`

**Status:** `pending` | `queued` | `sent` | `delivered` | `opened` | `clicked` | `claimed` | `failed` | `bounced` | `unsubscribed`

### CampaignLog

`id`, `campaignId`, `level` (`info` | `warn` | `error`), `message`, `at`, `meta?` (recipientId, jobId, …)

## Application architecture

```
OutreachService
  → CampaignRepository
  → CampaignRecipientRepository
  → CampaignSegmentRepository
  → CampaignTemplateRepository
  → CampaignLogRepository
  → OutreachQueue          (enqueue / dequeue stub — no send)
  → EMDS render            (preview / future send body)
```

All repositories: port interface + **InMemory** adapter in this PRD.

### OutreachService responsibilities (this PRD)

- Create/update campaign (draft)
- Transition draft → ready (requires template + segment + validations)
- Pause / resume / cancel (status guards)
- Attach recipients (from explicit institution ids; bulk segment resolve can be stubbed)
- Enqueue pending recipients into `OutreachQueue` (status → queued) — **no delivery**
- Render template preview via EMDS
- Append CampaignLog entries for transitions
- `markRecipientClaimed({ institutionId, claimedAt })` for future claim conversion — **not wired into claim approve yet**
- Analytics stub: count recipients by status (no UI)

### OutreachQueue

```ts
type OutreachQueueJob = {
  id: string;
  campaignId: string;
  recipientId: string;
  channel: CampaignChannel;
  createdAt: string;
  availableAt: string;
};
```

`enqueue`, `listReady`, `acknowledge` (or equivalent). No SMTP call.

## Claim / Google hooks (interfaces only)

- Claimed conversion: recipient `claimedAt` + status `claimed` when institution is claimed after outreach (wiring in a later PRD).
- Google Business: segment filters may use `institution.googleBusiness.rating`.

## Acceptance

- [x] Design approved in conversation
- [x] Campaign / Recipient / Segment / Template / Log models
- [x] EMDS used for template HTML render
- [x] Queue infrastructure (no real send)
- [x] Extensible channel type
- [x] Typecheck passes; existing systems unchanged
- [x] No SMTP / Claim / Lead / Google Sync modifications

## Follow-ups (out of scope)

- Firestore adapters
- Send worker + rate limits
- Istanbul unclaimed campaign content
- Admin campaign UI + analytics screens
- Wire `markRecipientClaimed` into claim approval
