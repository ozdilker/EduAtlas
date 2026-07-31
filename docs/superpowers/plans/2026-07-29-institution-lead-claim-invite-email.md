# Institution Lead Claim-Invite Email Implementation Plan

> **For agentic workers:** Execute task-by-task. Steps use checkbox syntax.

**Goal:** After a successful lead save, fail-open send a claim-invite HTML email from `info@eduatlas.com` to `institution.contact.email`, with 24h rate limit, one-time claim token, delivery log, and `/claim?token=` prefill page.

**Architecture:** Optional dependency on `submitLead` after save; `EmailService` stays provider-agnostic (console MVP); tokens hashed at rest; rate limit via institution-scoped last-sent timestamp store.

**Tech Stack:** Domain + application ports, Firebase Admin Firestore adapters, Next.js App Router `/claim`, existing `renderEmailTemplate`.

## Global Constraints

- From address: **`info@eduatlas.com`** (constant / `EDUATLAS_MAIL_FROM` override)
- Lead create never depends on mail
- Max 1 claim-invite email / institution / 24h
- Token: random, hashed (SHA-256), 7-day expiry, single-use
- Queue/real SMTP: out of scope

## File map

| File | Responsibility |
|------|----------------|
| `packages/domain/src/claim-invite/*` | Token aggregate |
| `packages/domain/src/mail-delivery/*` | Delivery log model |
| `packages/application/src/notifications/email-service.ts` | Add `from` |
| `packages/application/src/notifications/send-institution-claim-invite-email.ts` | Core use case |
| `packages/application/src/leads/submit-lead.ts` | Hook after save |
| `packages/firebase/src/claims/*` / `notifications/*` | Firestore adapters |
| `apps/web/src/app/claim/page.tsx` | Token redeem UI |
| `apps/web/src/server/leads/submit-institution-lead-action.ts` | Wire deps |

## Tasks

### Task 1: Domain models
- [ ] ClaimInviteToken create/hash helpers
- [ ] MailDeliveryLog create helper
- [ ] Export from domain index

### Task 2: Email from + invite use case
- [ ] `SendEmailInput.from` required for claim invites
- [ ] `sendInstitutionClaimInviteEmail` + rate limit + template copy
- [ ] Wire optional `claimInviteEmail` into `submitLead`
- [ ] Unit tests (fail-open, rate limit, from address)

### Task 3: Firebase + in-memory adapters
- [ ] Token repository
- [ ] Delivery log repository
- [ ] Rate-limit timestamp store (`lastClaimInviteEmailAt`)

### Task 4: Web
- [ ] DI factories
- [ ] `/claim` page + mark token used after successful claim submit
- [ ] Lead server action wires claim invite deps

### Task 5: Verify
- [ ] `npm run typecheck` relevant workspaces
- [ ] Targeted vitest
