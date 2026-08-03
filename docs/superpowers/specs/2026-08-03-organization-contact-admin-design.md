# Organization Contact Admin Design

| Field | Value |
| --- | --- |
| **Date** | 2026-08-03 |
| **Status** | Approved |
| **Scope** | Admin-editable EduAtlas platform contact & Turkish address |
| **Related** | PayTR merchant site check; `/contact`, footer, legal pages; PayTR checkout fallbacks |

---

## 1. Goals

- Let admins edit EduAtlas company contact and domestic (TR) address without a deploy.
- Show those details on public surfaces PayTR (and users) can verify.
- Reuse the same record as fallback `user_address` / `user_phone` in PayTR iframe checkout when owner profile fields are missing.

### Non-goals

- Tax office / vergi no / MERSİS
- Map embed, multi-language copy, multiple office locations
- Per-institution contact (already on owner profiles)

---

## 2. Decisions (locked)

| Topic | Choice |
| --- | --- |
| Storage | Firestore `site_settings` doc `organization_contact` |
| Admin route | `/admin/site-contact` |
| Public surfaces | `/contact`, site footer, legal pages (email), Organization JSON-LD |
| PayTR | Checkout fallback from this record |
| Fields | Display name (unvan), email, phone, street, city (il), district (ilçe), postal code; country fixed `TR` |
| Empty fallback | Display name `EduAtlas`, email `info@eduatlas.com.tr` |

---

## 3. Data model

Document id: `organization_contact` in collection `site_settings`.

| Field | Type | Notes |
| --- | --- | --- |
| `displayName` | string | Public company/brand unvan |
| `email` | string | Required for sensible public mailto |
| `phone` | string | Optional but recommended for PayTR |
| `streetAddress` | string | Open address line |
| `addressLocality` | string | İlçe |
| `addressRegion` | string | İl |
| `postalCode` | string | Optional |
| `addressCountry` | `"TR"` | Always Turkey in v1 |
| `updatedAt` | ISO string | |
| `updatedByUserId` | string | Admin uid |

Domain factory validates email shape when present; trims strings; rejects empty `displayName` on save when admin submits (or apply fallback on read only — **prefer**: admin may save partial; public reader merges with defaults).

**Read merge:** missing/blank email → `info@eduatlas.com.tr`; missing displayName → `EduAtlas`.

---

## 4. Architecture

```
Admin UI (/admin/site-contact)
    → updateOrganizationContact (server action)
    → application use case
    → Firestore site_settings/organization_contact
    → revalidatePath(/contact, layout/footer consumers)

Public / SEO / PayTR
    → getOrganizationContact() (cached or per-request)
    → contact page, footer props, legal email, getSeoSiteConfig(), startPaytrCheckout fallbacks
```

Mirror existing homepage visuals stack under `packages/domain|application|firebase` `site/` and `apps/web` admin + site server modules.

---

## 5. Admin UX

- Nav item: **İletişim bilgileri** next to Site görselleri.
- Single form: unvan, e-posta, telefon, açık adres, il, ilçe, posta kodu.
- Save → success/error toast or inline status (same pattern as visuals/billing).
- AuthZ: existing `assertAdminPortalAccess`.

---

## 6. Public UX

### `/contact`

Show display name, mailto email, tel link, and formatted address block when any address part is set.

### Footer

Under brand tagline: email, phone (if set), one-line address (street · district · city).

### Legal pages

Replace hardcoded `LEGAL_CONTACT_EMAIL` usage with resolved organization email (pass from server pages or shared loader). Keep constant only as code fallback default.

### SEO

Map into `SeoSiteConfig.organizationEmail`, `organizationTelephone`, `organizationAddress`.

---

## 7. PayTR integration

In `startPaytrCheckoutAction` (or use-case input assembly):

- `userPhone` ← owner phone if any, else organization `phone`, else existing `"05000000000"` last resort.
- `userAddress` ← owner address if any, else formatted organization address (`street, district, city, postalCode, Türkiye`), else `"Türkiye"`.

Do not send merchant secrets; this is buyer-facing PayTR fields only.

---

## 8. Acceptance

- [ ] Admin can save contact; Firestore doc updates
- [ ] `/contact` shows address + phone + email after save
- [ ] Footer shows contact snippet
- [ ] Legal mailto uses saved email
- [ ] Organization schema includes address when set
- [ ] PayTR checkout uses org phone/address when owner lacks them
- [ ] Missing doc still renders with EduAtlas / info@eduatlas.com.tr fallbacks

---

## 9. Out of scope follow-ups

- Turkish path aliases content parity (`/iletisim`) if not already redirecting
- Mail template footer address wiring (optional later)
