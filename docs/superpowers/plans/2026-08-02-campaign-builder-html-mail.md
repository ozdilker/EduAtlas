# Campaign Builder & HTML Mail (OUTREACH-002) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin Campaign Builder at `/admin/outreach` to create a campaign from seeded Claim Invitation template + Istanbul segment, preview via EMDS, and send a single test email — with bulk start forbidden.

**Architecture:** Extend OUTREACH-001 in-memory stores with process singleton in `apps/web`; seed template/segment; EMDS claim-invitation renderer with `{{institutionName}}`; OutreachService test-send via existing `EmailService`; UI page + server actions. No Firestore, no bulk start.

**Tech Stack:** TypeScript, Next.js App Router server actions, `@eduatlas/ui` AdminShell, EMDS, existing SMTP/Console EmailService, Vitest.

## Global Constraints

- Persistence: **process-local in-memory singleton** (Option A).
- Template HTML **only** via EMDS — no new mail HTML shells.
- **Bulk campaign start forbidden** (no UI, no service method exposure for mass send).
- Test send: **exactly one** recipient address.
- Personalization v1: `{{institutionName}}` only.
- Do not modify Claim / Lead / Google Sync / analytics.
- Typecheck must pass.

## File map

| Path | Role |
| --- | --- |
| `packages/domain/src/outreach/campaign.ts` | Add optional `subjectOverride`, `preheader` |
| `packages/application/src/outreach/claim-invitation-mail.ts` | EMDS claim invitation compose + token replace |
| `packages/application/src/outreach/outreach-seeds.ts` | Seed template + segment constants + ensureSeeded() |
| `packages/application/src/outreach/outreach-service.ts` | `updateCampaign`, `sendTestEmail` |
| `packages/application/src/outreach/outreach-builder.test.ts` | Unit tests |
| `apps/web/src/server/outreach/store.ts` | Singleton stores + service factory |
| `apps/web/src/server/admin/outreach-actions.ts` | save / preview / testSend actions |
| `apps/web/src/server/admin/get-admin-outreach.ts` | Page data loader |
| `apps/web/src/app/admin/outreach/page.tsx` | Route |
| `packages/ui/src/admin/admin-outreach-page.tsx` | Builder UI |
| `packages/ui/src/admin/admin-nav.ts` | Kampanyalar nav item |
| `packages/ui/src/index.ts` | Export page |

---

### Task 1: Domain — campaign subject/preheader overrides

**Files:**
- Modify: `packages/domain/src/outreach/campaign.ts`
- Modify: `packages/domain/src/outreach/outreach.test.ts`

**Interfaces:**
- `CreateCampaignInput` / `Campaign` gain optional `subjectOverride?: string`, `preheader?: string`

- [ ] **Step 1: Extend tests** — createCampaign persists subjectOverride + preheader
- [ ] **Step 2: Implement** — trim optional fields; empty string → omit
- [ ] **Step 3: Typecheck domain + PASS tests**
- [ ] **Step 4: Commit** `Add campaign subject override and preheader fields.`

---

### Task 2: Claim invitation EMDS renderer + seed data

**Files:**
- Create: `packages/application/src/outreach/claim-invitation-mail.ts`
- Create: `packages/application/src/outreach/outreach-seeds.ts`
- Create: `packages/application/src/outreach/apply-mail-tokens.ts`
- Modify: `packages/application/src/outreach/index.ts`
- Test: `packages/application/src/outreach/outreach-builder.test.ts`

**Interfaces:**
```ts
export const CLAIM_INVITATION_TEMPLATE_ID = "tpl_claim_invitation";
export const ISTANBUL_UNCLAIMED_SEGMENT_ID = "seg_istanbul_unclaimed_email";

export function applyMailTokens(
  text: string,
  tokens: Readonly<{ institutionName: string }>,
): string; // replaces {{institutionName}}

export function renderClaimInvitationMail(input: Readonly<{
  subject: string;
  preheader: string;
  institutionName: string;
  ctaHref: string;
  bodyLines?: readonly string[];
}>): RenderedEmail;

export async function ensureOutreachSeeds(deps: {
  templateRepository: CampaignTemplateRepository;
  segmentRepository: CampaignSegmentRepository;
  now?: string;
}): Promise<void>;
```

**Claim invitation body (EMDS):**
- Header + badge “Kurum daveti”
- Title / subtitle (with institution name)
- Info box (EduAtlas intro)
- Section: advantages (3–4 short lines via info/success boxes or plain paragraphs)
- Primary CTA: “Kurum Panelini Aç” → `ctaHref` (default `/login` or `/owner` absolute via site base)
- Footer / legal

Default subject example: `{{institutionName}} için EduAtlas kurum paneli hazır`
Default preheader: `Velilerden gelen talepleri kaçırmayın — kurumunuzu ücretsiz sahiplenin.`

Seed segment filters: `{ cityId: "tr-34", verification: "unclaimed", hasEmail: true }`  
(Confirm Istanbul cityId matches geo catalog — use same id as elsewhere in repo.)

- [ ] **Step 1: Failing tests** for token replace + EMDS 600px + CTA label
- [ ] **Step 2: Implement renderer + seeds**
- [ ] **Step 3: PASS + Commit** `Add claim invitation EMDS mail and outreach seeds.`

---

### Task 3: OutreachService — updateCampaign + sendTestEmail

**Files:**
- Modify: `packages/application/src/outreach/outreach-service.ts`
- Modify: `packages/application/src/outreach/outreach-builder.test.ts`
- Modify: `packages/application/src/index.ts` (if new exports)

**Interfaces:**
```ts
updateCampaign(input: {
  campaignId: string;
  name: string;
  description?: string;
  templateId: string;
  segmentId: string;
  subjectOverride: string; // required non-empty after trim
  preheader: string;
  now: string;
}): Promise<Campaign>;

sendTestEmail(input: {
  campaignId: string;
  to: string;
  institutionName: string; // sample, e.g. "Örnek Anaokulu"
  ctaHref: string;
  now: string;
  emailService: EmailService;
}): Promise<{ messageId: string; rendered: RenderedEmail }>;
```

**Rules:**
- Validation: subjectOverride non-empty; template + segment must exist
- `sendTestEmail`: render claim invitation (or generic EMDS if template id matches seed); enqueue **one** queue job; call `emailService.send`; log `Test email sent to …`; **do not** change campaign status to running; **do not** call `enqueuePendingRecipients`
- No public `startBulk` method

- [ ] **Step 1: Failing service tests** (update + test send uses EmailService mock; queue has 1 job; status stays draft/ready)
- [ ] **Step 2: Implement**
- [ ] **Step 3: PASS + Commit** `Add campaign update and single-recipient test email send.`

---

### Task 4: Web singleton + server actions + page data

**Files:**
- Create: `apps/web/src/server/outreach/store.ts`
- Create: `apps/web/src/server/admin/get-admin-outreach.ts`
- Create: `apps/web/src/server/admin/outreach-actions.ts`
- Create: `apps/web/src/app/admin/outreach/page.tsx`

**store.ts:** module-level singleton of `createInMemoryOutreachStores` + queue + `createOutreachService`; `ensureOutreachSeeds` on first access.

**get-admin-outreach:** list campaigns, templates, segments; selected campaign if `?id=`.

**actions:**
- `saveOutreachCampaignAction(formData)` — create or update; redirect with notice
- `previewOutreachCampaignAction` — can be GET via page query or POST returning; prefer: preview rendered in page load from selected campaign fields (server-rendered HTML string in view data)
- `sendOutreachTestEmailAction(formData)` — `to`, `campaignId`, sample institutionName; uses `getEmailService()`

- [ ] **Step 1: Wire store + get + actions**
- [ ] **Step 2: Add route page (can temporarily render placeholder until UI task)**
- [ ] **Step 3: Manual sanity / typecheck web**
- [ ] **Step 4: Commit** `Wire admin outreach server store and actions.`

---

### Task 5: Admin UI — Campaign Builder page + nav

**Files:**
- Create: `packages/ui/src/admin/admin-outreach-page.tsx`
- Create: `packages/ui/src/admin/admin-outreach-content.ts` (view types if needed)
- Modify: `packages/ui/src/admin/admin-nav.ts` — `{ id: "outreach", label: "Kampanyalar", href: "/admin/outreach" }`
- Modify: `packages/ui/src/index.ts`
- Modify: `apps/web/src/app/admin/outreach/page.tsx` — pass data + actions
- Optional CSS in `packages/ui/src/styles/admin.css` for preview iframe/box

**UI:**
- List existing campaigns (links)
- Form: name, description, template select, segment select, subject, preheader
- Preview panel: `dangerouslySetInnerHTML` inside sandboxed iframe **or** div with email HTML (prefer iframe srcDoc)
- Test email: input + submit (no bulk start button)
- Notices for save/test success/error

- [ ] **Step 1: Implement UI + nav**
- [ ] **Step 2: Typecheck ui + web**
- [ ] **Step 3: Commit** `Add admin campaign builder UI with preview and test send.`

---

### Task 6: Spec acceptance + verify

**Files:**
- Modify: `docs/superpowers/specs/2026-08-02-campaign-builder-html-mail-design.md`

- [ ] Run:  
  `npx vitest run packages/application/src/outreach packages/domain/src/outreach`  
  `npm run typecheck --workspace=@eduatlas/domain`  
  `npm run typecheck --workspace=@eduatlas/application`  
  `npm run typecheck --workspace=@eduatlas/ui`  
  `npm run typecheck --workspace=@eduatlas/web`
- [ ] Check acceptance boxes
- [ ] Commit: `Mark campaign builder acceptance criteria complete.`

---

## Spec coverage

| Requirement | Task |
| --- | --- |
| Create campaign in admin | 4–5 |
| EMDS + Claim Invitation | 2 |
| Preview | 4–5 |
| Test mail only | 3–4 |
| Subject + preheader | 1, 3, 5 |
| `{{institutionName}}` | 2 |
| No bulk send | 3, 5 |
| In-memory singleton | 4 |

## Istanbul cityId note

Verify against `packages/firebase` / geo catalog (likely `tr-34`). Seed must use the real catalog id.
