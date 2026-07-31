# Premium Membership & Lead Monetization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use TDD where practical.

**Goal:** Ship configurable FREE/PRO/PREMIUM catalog, FREE lifetime 3-lead unlock, PII masking + “Ödeme yakında” upgrade CTA — without a live payment provider.

**Architecture:** Spec at `docs/superpowers/specs/2026-07-31-premium-membership-lead-monetization-design.md`. Entitlements on plans; subscriptions per institution; lead storage unchanged; presentation layer masks.

**Tech stack:** Domain + application packages, Firestore repos, Owner + Admin Next.js UI (existing patterns).

---

## File map

| Area | Files |
|------|--------|
| Domain | `packages/domain/src/billing/*` (plan, entitlements, subscription, mask helpers) |
| Application | `packages/application/src/billing/*`, lead presenters |
| Firebase | `packages/firebase/src/billing/*`, seed script |
| Owner web | `apps/web/src/server/owner/get-owner-portal.ts`, leads UI views |
| Owner UI | `packages/ui/src/owner/*` locked state + billing page |
| Admin | `apps/web/src/app/admin/billing/*`, actions |

---

### Task 1: Domain — entitlements + masking

**Files:**
- Create `packages/domain/src/billing/entitlements.ts`
- Create `packages/domain/src/billing/mask-lead-pii.ts`
- Create `packages/domain/src/billing/plan.ts`
- Create `packages/domain/src/billing/subscription.ts`
- Create `packages/domain/src/billing/index.ts`
- Export from `packages/domain/src/index.ts`
- Test `packages/domain/src/billing/mask-lead-pii.test.ts`
- Test `packages/domain/src/billing/resolve-lead-access.test.ts`

**Steps:**
1. Define entitlement keys as string constants + `EntitlementMap` type.
2. `resolveLeadVisibility({ ordinal, entitlements })` → `full` | `masked`.
3. `maskPersonName`, `maskPhone`, `maskEmail`, `maskMessage`.
4. `createBillingPlan`, `createInstitutionSubscription` factories (freeze).
5. Unit tests for ordinal 1–3 full, 4+ masked; unlimitedLeads bypass.
6. Commit: `Add billing domain types and lead PII masking.`

---

### Task 2: Application — access resolution + present leads

**Files:**
- Create `packages/application/src/billing/billing-plan-repository.ts` (interface)
- Create `packages/application/src/billing/subscription-repository.ts`
- Create `packages/application/src/billing/resolve-institution-billing-access.ts`
- Create `packages/application/src/billing/present-owner-leads.ts`
- Export from application index
- Tests for present-owner-leads

**Steps:**
1. `resolveInstitutionBillingAccess(institutionId)` loads subscription → plan → effective entitlements (FREE seed if missing).
2. `presentOwnerLeads(leads, access)` sorts by createdAt asc for ordinal, maps to `PresentedLead` with `locked` flag and masked fields.
3. Tests with in-memory repos.
4. Commit: `Add billing access resolution and lead presentation.`

---

### Task 3: Firebase — plans + subscriptions + seed

**Files:**
- `packages/firebase/src/billing/firestore-billing-plan-repository.ts`
- `packages/firebase/src/billing/firestore-subscription-repository.ts`
- `packages/firebase/src/billing/seed-billing-plans.ts`
- Script `packages/firebase/scripts/seed-billing-plans.ts`
- Export from firebase server index

**Seed data:**
- free: quota 3, no unlimited
- pro: unlimitedLeads, export, emailNotifications, analyticsBasic, trialDays 7, prices 499 / 4990
- premium: pro + showcases + analyticsAdvanced + sponsored + featured, prices 999 / 9990

**Steps:**
1. Collections `billing_plans`, `institution_subscriptions`.
2. Seed script upserts plans.
3. Commit: `Add Firestore billing plan and subscription adapters.`

---

### Task 4: Wire owner leads portal

**Files:**
- Modify `apps/web/src/server/owner/get-owner-portal.ts`
- Modify `packages/ui/src/owner/owner-portal-content.ts` (types: `locked`, `upgradeMessage`)
- Modify `packages/ui/src/owner/owner-lead-list.tsx`, lead detail components
- CSS for blurred message / lock badge

**Steps:**
1. After loading leads, run `presentOwnerLeads`.
2. List/detail show masked PII + lock badge + “Yeni veli taleplerini görüntülemek için Premium'a geçin” + button to `/owner/billing` labeled **Ödeme yakında** (or page explains yakında).
3. Manual check / unit test on presenter wiring.
4. Commit: `Mask locked owner leads and show upgrade CTA.`

---

### Task 5: Owner billing page (no payment)

**Files:**
- `apps/web/src/app/owner/billing/page.tsx`
- `apps/web/src/server/owner/get-owner-billing-view.ts`
- `packages/ui/src/owner/owner-billing-page.tsx`

**Steps:**
1. Load active plans from catalog; show FREE/PRO/PREMIUM cards with prices.
2. CTAs disabled or open dialog: **“Ödeme altyapısı yakında.”**
3. Show current plan / trial status if any.
4. Commit: `Add owner billing page with coming-soon checkout.`

---

### Task 6: Admin plan management (MVP)

**Files:**
- `apps/web/src/app/admin/billing/page.tsx`
- Server actions to update plan prices / active / trialDays / entitlements JSON or toggles
- Link from admin nav

**Steps:**
1. List plans; edit monthly/yearly/trial/active.
2. Persist via Firestore repo.
3. Commit: `Add admin billing plan editor.`

---

### Task 7: Verification

1. Seed plans to `eduatlas-dev`.
2. Institution on FREE with ≥4 leads → first 3 open, rest masked.
3. Manually set subscription to `pro` + `trialing`/`active` → all leads open.
4. Billing page shows yakında; no charge.
5. Commit any fixes.

---

## Out of scope (later)

- iyzico/PayTR/Stripe
- Webhooks, invoices
- A/B price assignment UI
- Sponsored ranking algorithm
- SMS/WhatsApp packs
