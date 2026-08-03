# Organization Contact Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin-editable EduAtlas contact & Turkish address, shown on `/contact`, footer, legal pages, SEO Organization schema, and used as PayTR checkout phone/address fallbacks.

**Architecture:** Mirror homepage visuals: domain `OrganizationContact` → application get/update + repository port → Firestore `site_settings/organization_contact` → admin form at `/admin/site-contact` → public loaders wire contact into pages, layout footer, `getSeoSiteConfig`, and `startPaytrCheckoutAction`. Spec: `docs/superpowers/specs/2026-08-03-organization-contact-admin-design.md`.

**Tech Stack:** TypeScript monorepo (`packages/domain`, `packages/application`, `packages/firebase`, `packages/ui`, `packages/seo`, `apps/web`), Firestore Admin, Vitest, Next.js App Router server actions.

## Global Constraints

- Fields: displayName (unvan), email, phone, streetAddress, addressLocality (ilçe), addressRegion (il), postalCode; `addressCountry` always `TR`.
- Empty read fallbacks: displayName `EduAtlas`, email `info@eduatlas.com.tr`.
- Public surfaces: `/contact`, footer, legal mailto, Organization JSON-LD.
- PayTR: org phone/address only as fallback when owner fields missing.
- No vergi/MERSİS, no map, no multi-office.
- Commit only when the user asks (or when executing commit steps with approval).

---

## File map

| Area | Files |
|------|--------|
| Domain | `packages/domain/src/site/organization-contact.ts`, tests, `site/index.ts`, package index |
| Application | `organization-contact-repository.ts`, `organization-contact.ts` (get/update), tests, exports |
| Firebase | `firestore-organization-contact-repository.ts`, site index + server exports |
| Web site | `apps/web/src/server/site/organization-contact-repository.ts`, loaders |
| Admin | `apps/web/src/app/admin/site-contact/page.tsx`, server action, UI page + nav |
| Public | contact + legal pages, `PublicShell` / `SiteFooter` / layout, `seo-site.ts` |
| PayTR | `start-paytr-checkout-action.ts` |

---

### Task 1: Domain — OrganizationContact

**Files:**
- Create: `packages/domain/src/site/organization-contact.ts`
- Create: `packages/domain/src/site/organization-contact.test.ts`
- Modify: `packages/domain/src/site/index.ts`
- Modify: `packages/domain/src/index.ts`

**Interfaces:**
- Produces: `OrganizationContact`, `DEFAULT_ORGANIZATION_CONTACT_EMAIL`, `DEFAULT_ORGANIZATION_DISPLAY_NAME`, `createOrganizationContact`, `resolveOrganizationContact`, `formatOrganizationAddressLine`, `formatOrganizationAddressMultiline`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from "vitest";
import {
  createOrganizationContact,
  formatOrganizationAddressLine,
  resolveOrganizationContact,
} from "./organization-contact";

describe("createOrganizationContact", () => {
  it("trims fields and forces TR country", () => {
    const c = createOrganizationContact({
      displayName: "  EduAtlas Yazılım  ",
      email: " Info@EduAtlas.com.tr ",
      phone: " 0212 000 00 00 ",
      streetAddress: " Örnek Cad. No:1 ",
      addressLocality: " Kadıköy ",
      addressRegion: " İstanbul ",
      postalCode: " 34710 ",
    });
    expect(c.displayName).toBe("EduAtlas Yazılım");
    expect(c.email).toBe("info@eduatlas.com.tr");
    expect(c.addressCountry).toBe("TR");
  });

  it("rejects invalid email when provided", () => {
    expect(() =>
      createOrganizationContact({ email: "not-an-email" }),
    ).toThrow(/email/i);
  });
});

describe("resolveOrganizationContact", () => {
  it("fills defaults for blank name and email", () => {
    const r = resolveOrganizationContact(createOrganizationContact({}));
    expect(r.displayName).toBe("EduAtlas");
    expect(r.email).toBe("info@eduatlas.com.tr");
  });
});

describe("formatOrganizationAddressLine", () => {
  it("joins non-empty parts", () => {
    const c = resolveOrganizationContact(
      createOrganizationContact({
        streetAddress: "Örnek Cad. No:1",
        addressLocality: "Kadıköy",
        addressRegion: "İstanbul",
        postalCode: "34710",
      }),
    );
    expect(formatOrganizationAddressLine(c)).toContain("Kadıköy");
    expect(formatOrganizationAddressLine(c)).toContain("İstanbul");
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run packages/domain/src/site/organization-contact.test.ts`

- [ ] **Step 3: Implement**

```ts
export const DEFAULT_ORGANIZATION_DISPLAY_NAME = "EduAtlas";
export const DEFAULT_ORGANIZATION_CONTACT_EMAIL = "info@eduatlas.com.tr";
export const ORGANIZATION_CONTACT_COUNTRY = "TR";

export type OrganizationContact = Readonly<{
  readonly displayName: string;
  readonly email: string;
  readonly phone: string;
  readonly streetAddress: string;
  readonly addressLocality: string;
  readonly addressRegion: string;
  readonly postalCode: string;
  readonly addressCountry: "TR";
  readonly updatedAt: string;
  readonly updatedByUserId?: string;
}>;

export type CreateOrganizationContactInput = {
  readonly displayName?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly streetAddress?: string;
  readonly addressLocality?: string;
  readonly addressRegion?: string;
  readonly postalCode?: string;
  readonly updatedAt?: string;
  readonly updatedByUserId?: string;
};

export function createOrganizationContact(
  input: CreateOrganizationContactInput = {},
): OrganizationContact {
  const emailRaw = input.email?.trim().toLowerCase() ?? "";
  if (emailRaw && !emailRaw.includes("@")) {
    throw new Error("OrganizationContact.email must be a valid email.");
  }
  return Object.freeze({
    displayName: input.displayName?.trim() ?? "",
    email: emailRaw,
    phone: input.phone?.trim() ?? "",
    streetAddress: input.streetAddress?.trim() ?? "",
    addressLocality: input.addressLocality?.trim() ?? "",
    addressRegion: input.addressRegion?.trim() ?? "",
    postalCode: input.postalCode?.trim() ?? "",
    addressCountry: ORGANIZATION_CONTACT_COUNTRY,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
    ...(input.updatedByUserId?.trim()
      ? { updatedByUserId: input.updatedByUserId.trim() }
      : {}),
  });
}

/** Public-facing merge with defaults. */
export function resolveOrganizationContact(
  contact: OrganizationContact,
): OrganizationContact {
  return createOrganizationContact({
    ...contact,
    displayName: contact.displayName || DEFAULT_ORGANIZATION_DISPLAY_NAME,
    email: contact.email || DEFAULT_ORGANIZATION_CONTACT_EMAIL,
  });
}

export function formatOrganizationAddressLine(contact: OrganizationContact): string {
  return [contact.streetAddress, contact.addressLocality, contact.addressRegion, contact.postalCode]
    .map((p) => p.trim())
    .filter(Boolean)
    .join(", ");
}

export function formatOrganizationAddressMultiline(contact: OrganizationContact): string {
  const line1 = contact.streetAddress.trim();
  const line2 = [contact.postalCode, contact.addressLocality, contact.addressRegion]
    .map((p) => p.trim())
    .filter(Boolean)
    .join(" ");
  return [line1, line2, contact.addressCountry === "TR" ? "Türkiye" : ""]
    .filter(Boolean)
    .join("\n");
}

export function formatOrganizationAddressForPaytr(contact: OrganizationContact): string {
  const line = formatOrganizationAddressLine(contact);
  return line ? `${line}, Türkiye` : "";
}
```

Export from `site/index.ts` and package `index.ts`.

- [ ] **Step 4: Tests PASS**

- [ ] **Step 5: Commit** (if requested)

---

### Task 2: Application — repository + get/update

**Files:**
- Create: `packages/application/src/site/organization-contact-repository.ts`
- Create: `packages/application/src/site/organization-contact.ts`
- Create: `packages/application/src/site/organization-contact.test.ts`
- Modify: `packages/application/src/site/index.ts`, `packages/application/src/index.ts`

**Interfaces:**
- Consumes: domain factories above
- Produces: `OrganizationContactRepository`, `getOrganizationContact`, `updateOrganizationContact`

```ts
export interface OrganizationContactRepository {
  get(): Promise<OrganizationContact | null>;
  save(contact: OrganizationContact): Promise<OrganizationContact>;
}
```

- [ ] **Step 1: Failing tests** (in-memory repo)

1. `getOrganizationContact` with null repo → resolved defaults via `createOrganizationContact({})` then `resolveOrganizationContact`
2. `updateOrganizationContact` saves trimmed payload + `updatedByUserId` / `updatedAt`
3. Invalid email on update throws

- [ ] **Step 2: Implement**

```ts
export async function getOrganizationContact(deps: {
  organizationContactRepository: OrganizationContactRepository;
}): Promise<OrganizationContact> {
  const raw = await deps.organizationContactRepository.get();
  return resolveOrganizationContact(raw ?? createOrganizationContact({}));
}

export async function updateOrganizationContact(
  input: CreateOrganizationContactInput & { updatedByUserId: string },
  deps: { organizationContactRepository: OrganizationContactRepository },
): Promise<OrganizationContact> {
  const next = createOrganizationContact({
    ...input,
    updatedAt: new Date().toISOString(),
    updatedByUserId: input.updatedByUserId,
  });
  // Persist raw (allow blank name/email in store); callers resolve on read
  await deps.organizationContactRepository.save(next);
  return resolveOrganizationContact(next);
}
```

- [ ] **Step 3: Tests PASS + export**

- [ ] **Step 4: Commit** (if requested)

---

### Task 3: Firestore + web repository wiring

**Files:**
- Create: `packages/firebase/src/site/firestore-organization-contact-repository.ts`
- Modify: `packages/firebase/src/site/index.ts`
- Modify: `packages/firebase/src/server/index.ts`
- Create: `apps/web/src/server/site/organization-contact-repository.ts`

**Interfaces:**
- Produces: `ORGANIZATION_CONTACT_DOC_ID = "organization_contact"`, `createFirestoreOrganizationContactRepository`, `getOrganizationContactRepository()`

- [ ] **Step 1: Firestore adapter**

Reuse `SITE_SETTINGS_COLLECTION` from homepage visuals module (import constant; do not duplicate collection name). Doc id `organization_contact`. Pattern: read/write + optional short TTL cache like visuals if already present; otherwise simple get/set is fine.

- [ ] **Step 2: Web getter**

Same `canUseFirebaseBackend` pattern as `homepage-visuals-repository.ts` / billing repos: Firestore when configured, else in-memory singleton for local.

- [ ] **Step 3: Smoke typecheck** `npx tsc -p packages/firebase --noEmit`

- [ ] **Step 4: Commit** (if requested)

---

### Task 4: Admin page + action + nav

**Files:**
- Create: `apps/web/src/server/admin/organization-contact-action.ts`
- Create: `apps/web/src/app/admin/site-contact/page.tsx`
- Create: `packages/ui/src/admin/admin-site-contact-page.tsx`
- Modify: `packages/ui/src/admin/admin-nav.ts` — add `{ id: "site-contact", label: "İletişim bilgileri", href: "/admin/site-contact" }` after visuals
- Modify: `packages/ui/src/index.ts` exports
- Modify: `packages/ui/src/styles/admin.css` if form spacing needed (reuse existing admin form classes)

**Interfaces:**
- Consumes: `getOrganizationContact`, `updateOrganizationContact`, `assertAdminPortalAccess`
- Produces: `AdminSiteContactPage`, `updateAdminOrganizationContactAction(formData)`

- [ ] **Step 1: Server action**

```ts
"use server";
// assertAdminPortalAccess("/admin/site-contact")
// parse FormData fields → updateOrganizationContact
// revalidatePath("/admin/site-contact"); revalidatePath("/contact"); revalidatePath("/"); 
// revalidatePath("/privacy"); "/terms"; "/kvkk"; "/cookies";
```

Return `{ ok: true } | { ok: false; message: string }` or redirect with query `?saved=1` matching visuals pattern — **prefer** same success pattern as `updateAdminBillingPlanAction` / visuals (inspect one and copy).

- [ ] **Step 2: UI form**

Labels (TR): Unvan, E-posta, Telefon, Açık adres, İlçe, İl, Posta kodu. Submit “Kaydet”.

- [ ] **Step 3: Route page** loads data via action helper, renders `AdminSiteContactPage`.

- [ ] **Step 4: Manual** — open `/admin/site-contact` as admin.

- [ ] **Step 5: Commit** (if requested)

---

### Task 5: Public contact + legal email wiring

**Files:**
- Modify: `apps/web/src/app/contact/page.tsx` → async; load contact; render name, email, phone, multiline address
- Modify: `apps/web/src/app/privacy/page.tsx`, `terms/page.tsx`, `kvkk/page.tsx`, `cookies/page.tsx` — async load email (shared helper)
- Create: `apps/web/src/server/site/get-public-organization-contact.ts` — thin wrapper calling get + repo
- Keep `LEGAL_CONTACT_EMAIL` as fallback constant only

```ts
// get-public-organization-contact.ts
export async function getPublicOrganizationContact() {
  const repo = await getOrganizationContactRepository();
  return getOrganizationContact({ organizationContactRepository: repo });
}
```

Contact page body example:

```tsx
const contact = await getPublicOrganizationContact();
// <p><strong>{contact.displayName}</strong></p>
// mailto + tel links
// <address>{formatOrganizationAddressMultiline(contact)}</address>
```

Legal pages: `const email = (await getPublicOrganizationContact()).email` replace `LEGAL_CONTACT_EMAIL` in mailto text.

- [ ] **Step 1: Implement helper + contact page**
- [ ] **Step 2: Wire four legal pages**
- [ ] **Step 3: Spot-check locally / typecheck apps/web**
- [ ] **Step 4: Commit** (if requested)

---

### Task 6: Footer + layout + SEO

**Files:**
- Modify: `packages/ui/src/layout/site-footer.tsx` — optional `contact?: { email; phone?; addressLine? }`
- Modify: `packages/ui/src/layout/public-page-shell.tsx` — pass contact through
- Modify: `apps/web/src/components/public-shell.tsx` — accept `organizationContact` prop
- Modify: `apps/web/src/app/layout.tsx` — await `getPublicOrganizationContact()`, pass into `PublicShell`; build SEO with contact
- Modify: `apps/web/src/lib/seo-site.ts` — accept optional contact override or split sync defaults vs async enrichment

**SEO mapping:**

```ts
organizationEmail: contact.email,
organizationTelephone: contact.phone || undefined,
organizationAddress: {
  streetAddress: contact.streetAddress || undefined,
  addressLocality: contact.addressLocality || undefined,
  addressRegion: contact.addressRegion || undefined,
  postalCode: contact.postalCode || undefined,
  addressCountry: "TR",
},
```

Omit empty address object parts (existing SEO builders already skip empties).

Footer under tagline:

```tsx
{contact ? (
  <div className="ea-footer__contact">
    <a href={`mailto:${contact.email}`}>{contact.email}</a>
    {contact.phone ? <a href={`tel:...`}>{contact.phone}</a> : null}
    {contact.addressLine ? <p>{contact.addressLine}</p> : null}
  </div>
) : null}
```

Note: root `metadata` export is sync today — keep sync metadata with email default; Organization JSON-LD (if injected per-page) should use async contact. If Organization schema is only from layout metadata alternatives, find where `organization` JSON-LD is emitted (`grep organization` under `apps/web`) and wire contact there.

- [ ] **Step 1: Grep JSON-LD organization injection; wire contact**
- [ ] **Step 2: Footer + shell + layout props**
- [ ] **Step 3: CSS for `.ea-footer__contact`**
- [ ] **Step 4: Commit** (if requested)

---

### Task 7: PayTR checkout fallbacks

**Files:**
- Modify: `apps/web/src/server/owner/start-paytr-checkout-action.ts`

- [ ] **Step 1: Load org contact alongside plans**

```ts
const org = await getPublicOrganizationContact();
const userPhone = org.phone.trim() || "05000000000";
const userAddress =
  formatOrganizationAddressForPaytr(org).trim() || "Türkiye";

await startPaytrCheckout({
  ...,
  userName: user.displayName,
  userPhone,
  userAddress,
  ...
}, ...);
```

(Owner institution phone/address not currently passed — org contact is the new primary fallback before hardcoded defaults.)

- [ ] **Step 2: Typecheck**
- [ ] **Step 3: Commit** (if requested)

---

### Task 8: Acceptance pass

- [ ] Unit tests: domain + application organization-contact
- [ ] Admin save → Firestore `site_settings/organization_contact`
- [ ] `/contact`, footer, legal mailto, schema address
- [ ] Missing doc → EduAtlas / info@eduatlas.com.tr
- [ ] PayTR start uses org phone/address when set

Run:

```bash
npx vitest run packages/domain/src/site/organization-contact.test.ts packages/application/src/site/organization-contact.test.ts
npx tsc -p apps/web --noEmit
```

---

## Spec coverage

| Spec | Task |
|------|------|
| Domain model + defaults | 1 |
| get/update use cases | 2 |
| Firestore doc | 3 |
| `/admin/site-contact` | 4 |
| `/contact` + legal email | 5 |
| Footer + SEO | 6 |
| PayTR fallback | 7 |
| Acceptance | 8 |
