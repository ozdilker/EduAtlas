# PRD-BILLING-001 — Premium Membership & Lead Monetization (Design)

**Date:** 2026-07-31  
**Status:** Approved for MVP (payment deferred)  
**Priority:** Critical

## Goal

Give institutions commercial value through managed plans (FREE / PRO / PREMIUM), lead unlock gates, and upgrade CTAs — without forcing parents to pay or institutions to register under pressure.

## Decisions (locked)

| Topic | Decision |
|-------|----------|
| Parent UX | Always free; no friction |
| Plans | FREE, PRO, PREMIUM (catalog-driven, not hardcoded prices) |
| FREE lead quota | Lifetime first **3** leads fully visible |
| Lead #4+ | Lead is stored; PII **masked** until entitled |
| Upgrade unlocks | All historical locked leads become visible |
| Trial | **7 days** for **PRO and PREMIUM** |
| Pricing (seed) | PRO ₺499/mo · ₺4.990/yr · PREMIUM ₺999/mo · ₺9.990/yr |
| Payment | **Not live** — checkout shows **“Yakında”** |
| Feature access | Entitlement / feature-flag map on each plan |
| A/B pricing | Schema-ready; inactive in v1 |
| Existing `isPremium` | Kept as denormalized search/display flag synced from active PREMIUM (or sponsored) entitlement |

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌────────────────────┐
│ billing_plans│────▶│ entitlements map │────▶│ hasEntitlement()   │
└─────────────┘     └──────────────────┘     └─────────┬──────────┘
                                                       │
┌────────────────────────┐     ┌───────────────────────▼──────────┐
│ institution_subscriptions│───▶│ resolveInstitutionAccess(inst)   │
└────────────────────────┘     └───────────────────────┬──────────┘
                                                       │
                       ┌───────────────────────────────▼──────────┐
                       │ presentOwnerLead(lead, access, ordinal)  │
                       │ → full | masked + upgrade CTA            │
                       └──────────────────────────────────────────┘
```

### Plan catalog (`billing_plans`)

Admin-editable documents (seeded defaults):

- `code` (stable key: `free` | `pro` | `premium` | future codes)
- `name`, `description`
- `monthlyPriceTry`, `yearlyPriceTry`, `discountPercent` (display)
- `trialDays` (0 for FREE; 7 for PRO/PREMIUM seed)
- `active`, `sortOrder`
- `entitlements`: `Record<string, boolean | number>`  
  Examples: `freeLeadQuota: 3`, `unlimitedLeads: true`, `leadExport: true`, `emailNotifications: true`, `analyticsBasic: true`, `analyticsAdvanced: true`, `cityShowcase: true`, `categoryShowcase: true`, `sponsoredListing: true`, `featuredBadge: true`

New packages = new docs; app code only checks entitlement keys.

### Subscription (`institution_subscriptions`)

- `institutionId`, `planCode`, `status` (`trialing` | `active` | `canceled` | `expired` | `none`)
- `billingPeriod` (`monthly` | `yearly` | null)
- `trialEndsAt`, `currentPeriodStart`, `currentPeriodEnd`, `canceledAt`
- `paymentProvider` (`none` for MVP), `externalSubscriptionId` (null until PSP)

Default: no doc → treat as FREE with seed FREE entitlements.

### Lead presentation (does not change lead storage)

1. List leads for institution ordered by `createdAt` ascending for **quota ordinal** (1..n lifetime).
2. If `unlimitedLeads` or ordinal ≤ `freeLeadQuota` → full PII.
3. Else → mask name/phone/email/message; set `locked: true`; show upgrade CTA (“Yakında”).
4. When plan becomes PRO/PREMIUM (or trial active), presenter returns full PII for all leads — no data migration.

Masking examples (domain helpers):

- Name: `Ahmet Y*****`
- Phone: `05********`
- Email: `ah****@gmail.com`
- Message: blurred / placeholder text in UI

### Checkout (MVP)

Owner “Premium’a Geç” / plan picker → `/owner/billing` (or modal) with plan cards and prices from catalog → primary CTA disabled/secondary: **“Ödeme yakında”**. No charge, no PSP webhook.

### Admin

`/admin/billing` (or `/admin/plans`): list/edit plans, prices, trial days, active flag, entitlement toggles. No code deploy for price changes.

### Future hooks (not built now)

- Price offers / experiments (`priceOfferId` on subscription)
- Lead credit packs, SMS/WhatsApp packs
- PSP adapter interface (`BillingPaymentProvider`) with `none` stub

## Non-goals (MVP)

- Live payments, invoices PDF, tax
- SMS / WhatsApp / push
- A/B price assignment UI
- Sponsored placement ranking logic beyond entitlement flag + existing `isPremium`

## Acceptance (MVP)

- [ ] Parents unchanged / free
- [ ] First 3 leads full; 4+ masked for FREE
- [ ] Leads keep being created when locked
- [ ] Entitled plan shows all leads unmasked
- [ ] Upgrade surfaces say payment **yakında**
- [ ] Plan prices/features editable via Admin (Firestore), not hardcoded in UI
- [ ] Architecture allows new plan codes without core rewrites
