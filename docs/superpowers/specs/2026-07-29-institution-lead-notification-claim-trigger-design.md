# PRD-MKT-002 — Institution Lead Notification & Claim Trigger (Design)

**Status:** Approved for planning  
**Date:** 2026-07-29  
**Source PRD:** Institution Lead Notification & Claim Trigger  
**Priority:** Critical (Growth)

## Goal

When a parent submits an information request on an institution detail page:

1. The lead continues to be created exactly as today (owner panel inbox unchanged).
2. If the institution has a registered contact email, EduAtlas sends a professional HTML email that encourages claiming the profile.
3. Lead creation never depends on mail delivery.

## MVP decisions (locked)

| Decision | Choice |
|----------|--------|
| Mail transport | Existing `EmailService` + **ConsoleEmailService** (sync, fail-open) |
| Queue / Resend / SMTP / SES | **Out of scope** (next sprint) |
| Claim CTA behavior | **Prefill form**: `/claim?token=...` resolves institution; user submits via existing `submitClaimRequest` |
| Rate limit | Max **1 claim-invite email per institution per 24 hours** |
| Recipient | `institution.contact.email` (registered institution email) |
| From address | **`info@eduatlas.com`** (`EDUATLAS_MAIL_FROM` override) |
| Retry worker | **Out of scope**; `retryCount` stored as `0` |

## Non-goals (this sprint)

- Async mail queue / worker
- Real provider adapters (Resend, SMTP, SendGrid, SES, Postmark)
- Automatic claim creation on email click
- Other notification types (reviews, ratings, weekly digests, etc.) — share `EmailService` later
- Changing parent-facing lead UX or owner lead inbox UX

## Current baseline

- Lead path: profile dialog → `submitInstitutionLeadAction` → `submitLead` → Firestore `leads` → optional sync `emitLeadReceived` for owner binding.
- Notifications: domain models + `NotificationService` + `EmailService` port + `ConsoleEmailService` + HTML renderer in `email-templates.ts`.
- Claim backend exists (`submitClaimRequest`, `claim_requests`); **no `/claim` route** and **no invite tokens**.
- Live institution page wires lead CTA only; claim CTA UI exists but is not the mail landing path.

## Architecture

```text
Parent submits lead form
        │
        ▼
 submitLead (unchanged validation + save)
        │
        ├─► return success to UI  (never waits on mail)
        │
        └─► fail-open side effect: sendInstitutionClaimInviteEmail
                 │
                 ├─ no contact.email? skip + optional log skipped
                 ├─ rate limited (24h)? skip + log skipped
                 ├─ mint ClaimInviteToken (raw in CTA URL only)
                 ├─ render HTML (PRD copy + claim CTA)
                 ├─ EmailService.send (console)
                 └─ write MailDeliveryLog (sent | failed)
```

Owner-panel `emitLeadReceived` (if configured) remains a separate channel for authenticated owners. This feature is the **growth claim-invite** email to the institution contact address.

## Components

### 1. Domain — `ClaimInviteToken`

Immutable record fields:

- `id`
- `tokenHash` (SHA-256 of raw token; raw never stored)
- `institutionId`
- `leadId`
- `expiresAt` (default **7 days** from mint)
- `usedAt?`
- `createdAt`

Rules:

- Raw token: cryptographically random, URL-safe, unguessable
- Single-use: redeem marks `usedAt`; further use rejected
- Expired tokens rejected

### 2. Domain / application — `MailDeliveryLog`

Fields required by PRD:

- `leadId`
- `institutionId`
- `sent` / `status` (`sent` | `failed` | `skipped`)
- `sentAt` (or `attemptedAt`)
- `provider` (`console` for MVP)
- `success` boolean (derived from status)
- `retryCount` (always `0` this sprint)
- optional `skipReason` / `errorMessage`
- optional `notificationKind` = `institution_claim_invite`

### 3. Application — `sendInstitutionClaimInviteEmail` (or equivalent)

Called only after successful `leadRepository.save`.

Inputs: saved lead, institution, deps (email service, token repo, delivery log repo, clock, site base URL).

Behavior:

1. Require `institution.contact.email`.
2. Enforce 24h institution rate limit.
3. Mint token; persist hash.
4. Build CTA: `{siteUrl}/claim?token={rawToken}`.
5. Render PRD HTML + text fallback via existing template renderer (extended copy).
6. `emailService.send({ to, subject, html, text })`.
7. Persist delivery log.
8. Swallow all errors; never throw into `submitLead` result path.

### 4. Rate limit

- Scope: **claim-invite emails only** (not parent lead submission rate limit).
- Window: 24 hours per `institutionId`.
- Storage preference: `institutions/{id}.lastClaimInviteEmailAt` updated on successful send **or** query latest successful `MailDeliveryLog` for kind `institution_claim_invite`.
- Chosen approach for implementation: denormalized `lastClaimInviteEmailAt` on institution document for O(1) check; update only after successful send. Failed sends do not burn the rate-limit window.

### 5. HTML email content

Use / extend `renderEmailTemplate`:

- Greeting + “Bugün EduAtlas üzerinden … yeni bir talep oluşturdu.”
- CTA label: **Kurumumu Sahiplen** → claim token URL
- Footer section bullets:
  - EduAtlas nedir?
  - Neden sahiplenmelisiniz? (ücretsiz güncelleme, doğrulanmış rozet, güncel bilgi)

Responsive table HTML already exists; keep that layout.

### 6. Web — `/claim`

- Route: `apps/web/src/app/claim/page.tsx` (query `token`)
- Server: resolve token → institution summary or error states (invalid / expired / used)
- Client/UI: existing claim form patterns, institution prefilled/hidden; submit via `submitInstitutionClaimAction` / `submitClaimRequest`
- On successful claim submit: mark token `usedAt` (same transaction/order as claim save when practical; otherwise immediately after successful save)

### 7. Wiring

- Hook side effect at end of `submitLead` after save (preferred single insertion point), or thin wrapper in web server action that calls application helper after `submitLead` — prefer **inside application `submitLead`** behind an optional dependency so tests can inject fakes without Firebase.

Optional dependency example:

```ts
claimInviteEmail?: {
  sendAfterLeadSaved: (input: { lead; institution }) => Promise<void>;
};
```

Always fail-open.

## Error handling

| Case | Behavior |
|------|----------|
| Lead validation/save fails | No mail |
| No institution email | Skip; no user-facing error |
| Rate limited | Skip; lead still created |
| Token/log/email throws | Catch; log failure; lead still created |
| Console provider “success” | Log `sent` with provider `console` |

No user-visible mail errors on the parent form.

## Testing

- Unit: rate limit window; token mint/verify/expire/use-once; template includes CTA href; fail-open when email throws.
- Integration-ish (application): `submitLead` returns lead even if invite helper rejects.
- Manual smoke: submit lead → console shows HTML with `/claim?token=` → open claim page → institution prefilled → submit claim.

## Acceptance criteria mapping

| PRD criterion | MVP coverage |
|---------------|--------------|
| Lead flow unchanged | Yes |
| No mail before successful lead | Yes |
| Async mail | Deferred (sync fail-open console); architecture remains provider-agnostic |
| HTML responsive template | Yes |
| Claim button in mail | Yes + secure token |
| Rate limit / no spam | Yes (24h / institution) |
| Adapter architecture | Yes (`EmailService`); real adapters next |
| Future notification types | Same port; not implemented now |
| Delivery logging | Yes (`MailDeliveryLog`) |
| Retry | Field present; worker deferred |

## Implementation boundaries

**In scope packages/apps:**

- `packages/domain` — token (+ maybe delivery log types if kept domain-owned)
- `packages/application` — invite send use case, template copy, `submitLead` hook, claim redeem helpers
- `packages/firebase` — token store, delivery log store, institution `lastClaimInviteEmailAt` mapping
- `apps/web` — `/claim` route, DI wiring, server action token pass-through

**Out of scope:** `functions/` mail worker, new npm mail SDKs.

## Open items resolved during brainstorming

- Prefill form (not auto-create claim)
- Console-first mail (not queue)
- Full narrow MVP includes token + rate limit + template
