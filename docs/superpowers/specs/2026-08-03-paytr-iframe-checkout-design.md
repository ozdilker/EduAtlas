# PayTR iFrame Checkout Design

| Field | Value |
| --- | --- |
| **Date** | 2026-08-03 |
| **Status** | Approved |
| **Scope** | One-time Pro/Premium purchase via PayTR iFrame API |
| **Related** | Owner `/owner/billing`, `InstitutionSubscription`, PayTR iFrame 1.ADIM / 2.ADIM samples |

---

## 1. Goals

- Let institution owners pay for **Pro** or **Premium** (monthly or yearly) with **PayTR iFrame API**.
- Keep card data off EduAtlas servers (PCI surface = PayTR iframe only).
- Activate entitlement **only** from PayTR’s asynchronous notification (callback), never from browser redirect.
- Support PayTR demo / go-live checklist: token + iframe + notification URL returning `OK`.

### Non-goals (v1)

- Recurring / kart saklama / otomatik yenileme
- Installments (`no_installment=1`)
- Refunds / admin chargeback UI
- Paying for Free plan
- Multi-currency (TRY only)

---

## 2. User flow

1. Owner opens `/owner/billing`, toggles monthly/yearly, clicks **Satın al** on Pro or Premium (not current Free CTA for Free).
2. Client calls a server action / API to start checkout with `{ planCode, billingPeriod }`.
3. Server creates a pending **PaymentOrder**, requests PayTR `iframe_token`, returns token + order id to the client.
4. Billing page opens a **modal** with PayTR iframe:  
   `https://www.paytr.com/odeme/guvenli/{iframe_token}`
5. Owner completes payment in iframe.
6. PayTR POSTs to **Bildirim URL** → EduAtlas verifies hash → marks order paid → upserts `InstitutionSubscription` to `active` with period dates.
7. Browser may land on `merchant_ok_url` or `merchant_fail_url` (informational only). Modal closes / page refreshes billing state.

---

## 3. Architecture

```
Owner UI (/owner/billing + modal)
    │
    ▼
startPaytrCheckout (server)
    │  create PaymentOrder (pending)
    │  HMAC + POST https://www.paytr.com/odeme/api/get-token
    ▼
iframe_token → modal iframe
    │
    ▼
PayTR
    │  async POST
    ▼
POST /api/billing/paytr/callback
    │  verify hash
    │  idempotent order update
    │  activate subscription
    ▼
response body: OK
```

Layers:

| Layer | Responsibility |
| --- | --- |
| `packages/domain` | `PaymentOrder` model + status helpers |
| `packages/application` | `startPaytrCheckout`, `handlePaytrNotification` use cases |
| `packages/firebase` | Firestore `payment_orders` + existing subscription repo |
| `apps/web` | Owner billing UI modal, env wiring, callback route, ok/fail pages |

Secrets stay server-only (`PAYTR_MERCHANT_KEY`, `PAYTR_MERCHANT_SALT`).

---

## 4. PaymentOrder

Firestore collection: `payment_orders`  
Document id = `merchantOid` (PayTR unique order id).

| Field | Notes |
| --- | --- |
| `merchantOid` | Unique per attempt; alphanumeric, sent to PayTR |
| `institutionId` | Owner’s institution |
| `planCode` | `pro` \| `premium` |
| `billingPeriod` | `monthly` \| `yearly` |
| `amountTry` | Integer TRY (e.g. 499) |
| `amountKurus` | `amountTry * 100` (PayTR `payment_amount`) |
| `status` | `pending` \| `paid` \| `failed` |
| `paytrStatus` | Raw callback `status` when present |
| `totalAmountKurus` | Callback `total_amount` when present |
| `createdAt` / `updatedAt` | ISO |

`merchantOid` format: `ea` + compact timestamp + short random (must stay unique; no session dependency on callback).

---

## 5. PayTR mapping (from official samples)

### 5.1 get-token (1. ADIM)

- Endpoint: `POST https://www.paytr.com/odeme/api/get-token`
- Hash string:  
  `merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + no_installment + max_installment + currency + test_mode`  
  then append `merchant_salt`, HMAC-SHA256 with `merchant_key`, Base64.
- Fixed v1 params:
  - `currency=TL`
  - `no_installment=1`
  - `max_installment=0`
  - `lang=tr`
  - `timeout_limit=30`
  - `test_mode` from `PAYTR_TEST_MODE` (`1` for demo)
  - `debug_on=1` while testing, `0` in production config
- `user_basket`: Base64(JSON of `[[planName, "unitPrice", 1]]`)
- `payment_amount`: kuruş integer as string/number per PayTR sample
- `merchant_ok_url` / `merchant_fail_url`: absolute HTTPS URLs under site origin
- Buyer fields from owner session / institution contact (email required; phone/name/address with safe fallbacks if missing)

### 5.2 Notification (2. ADIM)

- Route: `POST /api/billing/paytr/callback` (public; no session)
- Verify:  
  `HMAC_SHA256(merchant_oid + merchant_salt + status + total_amount, merchant_key)` Base64 == `hash`
- On bad hash → fail (non-OK) so PayTR retries / we detect misconfig
- On good hash:
  - Load order by `merchant_oid`
  - If already `paid` → still respond `OK` (idempotent)
  - If `status=success` → mark paid + activate subscription
  - If failed → mark `failed`
- Response body **must** be plain `OK`

### 5.3 Redirect pages

- `/owner/billing/result?status=ok`
- `/owner/billing/result?status=fail`  
  Informational copy only; poll/refresh subscription from Firestore.

---

## 6. Subscription activation

On successful notification:

```
status: active
planCode: order.planCode
billingPeriod: order.billingPeriod
paymentProvider: "paytr"
externalSubscriptionId: merchantOid
currentPeriodStart: now
currentPeriodEnd: now + 30 days (monthly) | + 365 days (yearly)
updatedAt: now
```

Upsert via existing `InstitutionSubscriptionRepository` (doc id = institutionId).

If owner already has an active plan, v1 **replaces** with the newly paid plan/period (no proration).

---

## 7. UI

- Remove “Ödeme yakında” disabled state when PayTR env is configured.
- Enable **Satın al** for non-current paid plans (and allow upgrade from Pro→Premium).
- On click: start checkout → open modal with responsive iframe (min height ~400–600px).
- Modal: title (plan + period + price), iframe, close button (closing does not cancel PayTR; pending order may expire).
- After ok redirect or manual close, refresh billing view so current plan updates when webhook landed.

---

## 8. Configuration

| Env | Purpose |
| --- | --- |
| `PAYTR_MERCHANT_ID` | Merchant id |
| `PAYTR_MERCHANT_KEY` | HMAC key |
| `PAYTR_MERCHANT_SALT` | Salt |
| `PAYTR_TEST_MODE` | `1` demo / `0` live |
| `PAYTR_DEBUG_ON` | Optional, default `1` when test |
| `NEXT_PUBLIC_APP_URL` / site origin | Absolute ok/fail/callback URLs |

PayTR panel **Bildirim URL** must be set to:  
`https://eduatlas.com.tr/api/billing/paytr/callback`  
(or preview URL during demo).

Checkout is disabled (keep coming-soon message) if merchant credentials are missing.

---

## 9. Security & ops

- Never log merchant_key / salt / full card data.
- Callback has no session; trust only verified hash + known `merchantOid`.
- Amounts on callback should match order `amountKurus` (warn/fail closed if mismatch).
- Owner auth required to **start** checkout; institution must belong to session.
- Rate-limit start-checkout lightly (per institution) to avoid token spam.

---

## 10. Acceptance

- [ ] With `PAYTR_TEST_MODE=1`, owner can open modal iframe for Pro monthly
- [ ] Successful test payment → callback returns `OK` → subscription `active` with period end
- [ ] Duplicate callback does not double-apply
- [ ] Failed payment marks order `failed`; plan unchanged
- [ ] Bad hash does not activate subscription
- [ ] Redirect ok/fail pages do not themselves activate plans
- [ ] Missing PayTR env keeps billing CTA disabled with clear message

---

## 11. Implementation notes

- Prefer `fetch` + `URLSearchParams` / form body over deprecated `request` package from samples.
- Use Node `crypto.createHmac` as in samples.
- Keep PayTR client thin under `apps/web/src/server/billing/paytr/` or `packages/application` payment port + web adapter.
