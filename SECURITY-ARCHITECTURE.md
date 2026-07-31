# EduAtlas — Security Architecture

| Field | Value |
| --- | --- |
| **Product** | EduAtlas |
| **Document** | SECURITY-ARCHITECTURE.md |
| **Version** | 1.0 |
| **Sprint** | Sprint-001 — Foundation |
| **Task** | Task-016 |
| **Status** | Binding security baseline (EduAtlas + future Atlas OS products) |
| **Last updated** | 14 July 2026 |

---

## Document control

This document defines the **complete security architecture** for EduAtlas and the reusable baseline for future **Atlas OS** products. Security must be **Secure by Default**.

| Related document | Role |
| --- | --- |
| `FIREBASE-ARCHITECTURE.md` | Auth, Rules, Functions, Storage |
| `SYSTEM-ARCHITECTURE.md` | Layers, API boundaries |
| `DOMAIN-MODEL.md` | Ownership & permissions |
| `DATA-ACQUISITION.md` | Media, provenance, fake institutions |
| `PRD.md` | Consent, claims, leads |
| `BUSINESS-MODEL.md` | Trust / monetization guardrails |

**Non-goals:** Exploit code, offensive tooling, or concrete secret values.

**Protects:** Users · Institutions · Administrators · Platform data · Infrastructure.

---

## 1. Purpose

Establish controls so that:

1. Public discovery remains open **without** exposing privileged data.  
2. Leads and claim documents stay confidential.  
3. Owners and admins operate under **least privilege**.  
4. Abuse (spam, bots, fake entities, SEO spam) is constrained.  
5. Privacy obligations (KVKK; GDPR-compatible practices) are designed in.  
6. Patterns are **generatable** via Atlas CLI for other Atlas products.

---

## 2. Security principles

| Principle | Application |
| --- | --- |
| **Least Privilege** | Roles and service accounts get only required permissions; owners scoped to owned institutions |
| **Zero Trust** | Authenticate and authorize every privileged request; never trust client-only checks |
| **Defense in Depth** | Browser → CDN/headers → App Check → Auth → use-case AuthZ → Firestore/Storage Rules → monitoring |
| **Secure by Default** | Deny-by-default Rules; public write only via hardened Functions; safe cookie/session defaults |
| **Fail Secure** | On AuthZ/validation/dependency failure, deny access and prefer unavailable over open |
| **Security by Design** | Threats reviewed with features; security acceptance criteria in sprints |
| **Privacy by Design** | Minimize PII; consent for leads; retention & deletion paths defined before collection |

---

## 3. Threat model

### 3.1 Assets

| Asset | Sensitivity |
| --- | --- |
| Institution catalog (published) | Public |
| Unpublished / draft institutions | Internal |
| Leads, ContactRequests | Sensitive / Confidential PII |
| Claim proof documents | Sensitive |
| User credentials & sessions | Sensitive |
| Admin capabilities | Critical |
| SEO pages / rankings trust | Integrity |
| Secrets / service accounts | Critical |
| Backups | Confidential–Critical |

### 3.2 Actors

| Actor | Intent |
| --- | --- |
| Anonymous visitor | Legitimate use or abuse |
| Authenticated owner | Legitimate or malicious insider |
| Moderator / Admin | Privileged; risk of misuse |
| Automated bot | Spam, scraping, credential stuffing |
| Competitor / SEO abuser | Thin content, fake listings |
| External attacker | Account takeover, injection, data theft |

### 3.3 Threat catalog & controls (summary)

| Threat | Impact | Primary controls |
| --- | --- | --- |
| **Anonymous abuse** | Cost, spam, noise | App Check, rate limits, validation |
| **Spam** | Lead quality collapse | Form gates, honeypot, spam status, throttling |
| **Bots** | Credential stuffing, scrape, form flood | App Check, CAPTCHA triggers, WAF/CDN |
| **Fake institutions** | Trust & SEO damage | Moderation, verification levels, publish gates |
| **Fake leads** | Owner distrust | Validation, rate limits, spam marking, consent |
| **Privilege escalation** | Full compromise | Custom claims server-only; Rules; no client admin flags |
| **Credential theft** | Account takeover | Password policy, verification, future MFA, session hygiene |
| **Broken access control** | Data breach | Use-case AuthZ + Rules + tests |
| **Data leakage** | PII exposure | Field-level public DTOs; no PII in logs/analytics |
| **Injection** | Data/system compromise | Parameterized APIs; validation; least privilege DB |
| **XSS** | Session/data theft | CSP, encoding, sanitize rich text |
| **CSRF** | Unwanted state change | Framework Server Action protections; SameSite cookies |
| **SSRF** | Cloud metadata / internal access | Block arbitrary URL fetch from user input; allowlists |
| **Clickjacking** | UI redress | `frame-ancestors` / XFO deny |
| **Supply chain attacks** | Malicious code in build | Lockfiles, audit, pinned CI, limited publish rights |
| **Dependency compromise** | RCE / data theft | Continuously audit; rapid patch process |
| **API abuse** | DoS, scraping | Auth, quotas, App Check, pagination |
| **File upload abuse** | Malware, XSS via SVG, storage cost | Type/size allowlists, re-encode images, private paths |
| **SEO spam** | Ranking / trust loss | Name/description moderation; noindex thin; claim verify |
| **DDoS** | Availability loss | CDN/Hosting protections; cache public pages; degrade gracefully |

### 3.4 STRIDE snapshot (platform)

| STRIDE | Examples |
| --- | --- |
| Spoofing | Fake owner claim |
| Tampering | Client-side “isAdmin” |
| Repudiation | Missing audit on claim approve |
| Information disclosure | Lead list public Rules mistake |
| Denial of service | Lead flood |
| Elevation of privilege | Self-assign admin claim |

---

## 4. Authentication

### 4.1 Identity modes

| Principal | Auth requirement | Notes |
| --- | --- | --- |
| **Anonymous users** | None | Browse published catalog; hardened public writes only |
| **Parents** | Optional future Auth | Favorites/reviews later; MVP leads without account |
| **Institution Owners** | Firebase Auth required | Email/password MVP; approved ownership separate |
| **Moderators** | Auth + role claim | Subset of admin |
| **Administrators** | Auth + role claim | Full ops (except super-only) |
| **Super Administrators** | Auth + elevated claim | Role grant, dangerous merges, system flags |

### 4.2 Email verification

- Owner/Admin accounts: **email verified** before claim approval and before privileged portal use (recommended hard gate).  
- Unverified sessions: limited (e.g., view-only pending state).  
- Verification links single-use, short TTL.

### 4.3 Password policy (MVP)

| Rule | Spec |
| --- | --- |
| Minimum length | ≥ 10 characters |
| Complexity | Block known-breached / trivial passwords where feasible |
| Storage | Firebase Auth managed hashes only |
| Reset | `/forgot-password` flow; rate-limited |

### 4.4 Future MFA

| Phase | Control |
| --- | --- |
| Near-term | TOTP MFA for Admin / Super Admin |
| Later | MFA optional/required for owners with high lead volume |
| Future | Passkeys, hardware keys (see §20) |

### 4.5 Session strategy

| Topic | Spec |
| --- | --- |
| Session home | Firebase Auth ID tokens / refresh handled by official SDKs |
| Web | Secure cookies where SSR session bridging is used; `Secure`, `HttpOnly`, `SameSite` appropriate |
| Idle / absolute TTL | Shorter for Admin than Owner; force reauth for destructive actions |
| Logout | Revoke refresh where supported; clear client state |
| Concurrent sessions | Monitor anomalies; optional admin “logout all” later |

---

## 5. Authorization

### 5.1 RBAC roles

| Role | Capabilities (summary) |
| --- | --- |
| `anonymous` | Read published public DTOs; create lead/contact via Functions |
| `parent` (future) | + favorites/reviews |
| `owner` | Manage owned institution allowlisted fields, media, lead status |
| `moderator` | Claims queue, content moderation, limited catalog edits |
| `admin` | Full catalog, users (non-super), SEO, settings (non-destructive) |
| `super_admin` | Grant/revoke admin roles; system-critical settings; merge/delete policies |

Custom claims set **only** via Admin SDK in trusted Cloud Functions — never from clients.

### 5.2 Permission inheritance

```text
super_admin ⊃ admin ⊃ moderator
owner permissions are horizontal (resource-scoped), not above moderator
```

### 5.3 Ownership rules

| Rule | Spec |
| --- | --- |
| Resource scope | Owner actions require `institutionOwners` status `approved` for target `institutionId` |
| Primary owner MVP | One primary approved owner; additional owners future |
| Claim pending | No edit rights until approved |
| Revoked | Immediate loss of portal access (claims + Rules) |
| Unclaimed leads | Admin visibility; owner gains access after approval (product policy) |

### 5.4 Administrative permissions

Sensitive actions requiring audit + confirmed AuthZ:

- Publish / unpublish institution  
- Approve / reject / revoke claim  
- Merge institutions  
- Change roles  
- Export leads  
- Modify systemSettings security flags  

Destructive actions: Super Admin or dual-control policy recommended for role grants.

### 5.5 Enforcement layers

1. UI hides unauthorized nav (UX only).  
2. Application use-case AuthZ (mandatory).  
3. Firestore/Storage Rules (mandatory).  
4. Admin SDK paths only on server.  

---

## 6. Firebase security

### 6.1 Firestore Rules (principles)

| Principle | Spec |
| --- | --- |
| Default | Deny |
| Public read | Only published catalog fields / docs intended public |
| Leads | No public list/get; create via Function preferred |
| ContactRequests | Admin read; create via Function |
| institutionOwners | Involved user + admin; no public |
| admins | No broad client read; Admin SDK |
| seoPages | Public read if published+indexable fields; write admin/Functions |
| analytics | System write; owner read own counters only |

Rules tests are a release gate for schema changes.

### 6.2 Storage Rules

| Path class | Read | Write |
| --- | --- | --- |
| Public media (finalized) | Public | Owner/Admin via controlled upload flow |
| `tmp/` uploads | Owner only | Owner; short TTL |
| Claim documents | Owner + Admin | Owner; **never public** |
| Blog media | Public if published | Admin/editor |

### 6.3 Authentication

- Firebase Auth as IdP for privileged users.  
- Disable unused providers in MVP (keep attack surface small).  
- Monitor Auth metrics for stuffing.

### 6.4 App Check

- **Required** on public callables: lead create, contact create, claim request, expensive search if exposed.  
- Enforce in Functions; fail closed when tokens invalid in production.

### 6.5 Cloud Functions

| Control | Spec |
| --- | --- |
| Trust boundary | Validate Auth + App Check + schema on every privileged/public write |
| Admin SDK | Only inside Functions / trusted server |
| SSRF | No open URL fetch from user-supplied URLs without allowlist |
| Idempotency | Prevent replay side effects where relevant |
| Error messages | No stack traces or internal paths to clients |

### 6.6 Secret Manager

- API keys (email, search, AI) in Secret Manager / CI secrets — never client bundles, never git.  
- Rotate on personnel change and incident.

### 6.7 Service accounts

| Rule | Spec |
| --- | --- |
| Least privilege | Separate SA for CI deploy vs runtime Functions if possible |
| Key handling | Prefer workload identity / CI OIDC over long-lived JSON keys |
| Audit | Inventory SAs quarterly |

---

## 7. Data protection

### 7.1 Classification

| Class | Examples | Handling |
| --- | --- | --- |
| **Public** | Published institution name, description, public phone | CDN cacheable |
| **Internal** | Quality scores, moderation notes, unpublished drafts | AuthZ staff/owner as appropriate |
| **Confidential** | Lead messages, emails, claim queue details | Encrypted in transit; strict AuthZ; no public Rules |
| **Sensitive** | Auth secrets, claim ID docs, password resets | Strict storage; minimal retention; admin-only |

### 7.2 Encryption

| Layer | Spec |
| --- | --- |
| In transit | TLS everywhere (Hosting, APIs, Firebase) |
| At rest | Provider-managed encryption (Firestore/Storage/GCS backups) |
| Application-level | Consider extra encryption for highly sensitive docs if threat requires (future) |

### 7.3 Backups & recovery

Align with Firebase Architecture:

- Daily Firestore export to GCS (prod)  
- Storage versioning / backup  
- Auth export practices periodic  
- Restore drills; access to backups tightly controlled  

---

## 8. Input validation

### 8.1 Strategy

**Validate at every trust boundary.** Shared schemas (`packages/validation`) used by Server Actions and Cloud Functions.

| Layer | Role |
| --- | --- |
| Client-side | UX only; never authoritative |
| Server-side | Authoritative allowlist validation |
| Persistence | Types/ranges; reject unknown fields |

### 8.2 Sanitization & encoding

| Input | Handling |
| --- | --- |
| Plain text (names, messages) | Length limits; strip control chars; store as text |
| HTML (future CMS) | Strict sanitizer allowlist; prefer Markdown subset |
| URLs | Scheme allowlist `https:`; block `javascript:` |
| Output to HTML | Contextual encoding (framework defaults) |
| Logs | Redact phone/email/message bodies |

### 8.3 Injection hardening

- No string-concatenated queries.  
- Firestore SDK parameterized APIs only.  
- Careful with dynamic `orderBy`/field names — allowlist only.

---

## 9. File upload security

| Control | Spec |
| --- | --- |
| **Allowed types** | Images: `image/jpeg`, `image/png`, `image/webp` (logo/gallery); Documents for claims: `application/pdf` (+ limited image proofs) |
| **Denied** | Executable, HTML, SVG as unrestricted public (SVG XSS risk — re-encode or block for public), scripts |
| **Size limits** | Per design/ops caps (e.g. image ≤ 5MB; PDF ≤ 10MB) — enforce server-side |
| **Virus scanning** | Future pipeline on claim docs |
| **Image validation** | Verify magic bytes; re-encode via optimization Function; strip EXIF GPS |
| **Metadata stripping** | Default on public media |
| **Pathing** | Server-generated object names; no user-controlled path traversal |
| **Quota** | Per-institution caps (free vs premium) |

---

## 10. Rate limiting

| Surface | Guidance (policy targets) |
| --- | --- |
| **Search** | Per IP / App Check: generous but bounded QPS; backoff on bursts |
| **Lead submissions** | Strict per IP + per institution + global daily caps |
| **Contact form** | Strict |
| **Authentication** | Firebase + additional throttling on custom endpoints; lockout/backoff |
| **Claim requests** | Low rate per user/IP |
| **Admin APIs** | Auth required; moderate limits; alert on anomalies |
| **Owner APIs** | Per-user limits; media upload separate quota |

Prefer edge + Function-level limits; fail secure with 429.

---

## 11. Abuse prevention

| Control | Spec |
| --- | --- |
| **Spam detection** | Content heuristics; disposable email patterns; repeated identical messages |
| **Bot detection** | App Check; progressive CAPTCHA on suspicion |
| **CAPTCHA strategy** | Invisible/risk-based on leads/claims when scores bad; avoid UX tax for all users initially |
| **IP throttling** | Sliding windows; temporary blocks |
| **Behavior analysis** | Future: velocity of claims, lead fan-out, scrape patterns |
| **Institution claim verification** | Manual review MVP; document proofs private; reject with reason; rate-limit attempts |
| **SEO spam** | Keyword-stuffed names blocked in moderation; unpublish path |
| **Honeypot** | Hidden fields on public forms |

---

## 12. Logging

### 12.1 Audit logs (mandatory events)

| Event class | Examples |
| --- | --- |
| **Authentication** | Login success/failure, logout, password reset request, email verify |
| **Authorization** | Permission denials on privileged actions |
| **Administrative** | Publish, claim decision, role change, settings change, merge |
| **Data access** | Bulk lead export; sensitive document download |
| **Security** | App Check failures spike, Rules denials anomalies |

### 12.2 Log hygiene

- No passwords, tokens, raw lead message bodies, or full ID documents in logs.  
- Correlate with request IDs.  
- Retain audit logs longer than verbose app logs (define retention).  
- Access to logs restricted to ops/security roles.

---

## 13. Monitoring

| Signal | Response |
| --- | --- |
| **Failed logins** spike | Alert; consider temporary hardening |
| **Permission violations** burst | Investigate broken client or attack |
| **Lead create** anomaly | Tighten rate limit / CAPTCHA |
| **Traffic anomalies** | CDN/WAF; scale/cache |
| **Function error rates** | Page on-call |
| **Storage upload spikes** | Quota / disable uploads |
| **Suspicious claim patterns** | Freeze claim approvals |

Dashboards for Auth, Functions, Hosting, and business abuse KPIs.

---

## 14. Dependency security

| Practice | Spec |
| --- | --- |
| **Lockfiles** | Committed; reproducible installs |
| **Updates** | Regular dependency update cadence; emergency for critical CVEs |
| **Auditing** | `npm audit` / equivalent in CI; triage process |
| **Supply chain verification** | Prefer maintained packages; pin GitHub Actions SHAs where possible |
| **License review** | Avoid incompatible / unknown licenses in prod |
| **Minimal deps** | Challenge new dependencies in review |

---

## 15. CI/CD security

| Control | Spec |
| --- | --- |
| **Secret management** | CI secret store; never echo secrets; no secrets in PR logs |
| **Environment separation** | dev / staging / prod Firebase projects |
| **Protected branches** | `main` requires reviews; no force-push |
| **Release approvals** | Human approval for production promote |
| **Artifact integrity** | Build from clean CI; deploy known artifacts |
| **Least privilege deploy** | CI SA limited to required Firebase/GCP APIs |
| **PR previews** | No production secrets in preview envs |
| **Rules deploy** | Coupled with tests |

---

## 16. Incident response

| Phase | Actions |
| --- | --- |
| **Detection** | Alerts, user reports, anomaly dashboards |
| **Triage** | Severity (P0 data breach → P3 nuisance); assign owner |
| **Containment** | Revoke keys/sessions; disable abused endpoints; lockdown Rules; block IPs |
| **Eradication** | Patch vulnerability; rotate secrets; remove malicious data |
| **Recovery** | Restore service; verify AuthZ; monitor closely |
| **Postmortem** | Blameless write-up; action items; update this architecture if needed |
| **Notification** | Legal/privacy assessment for KVKK breach notification duties |

Maintain an on-call / escalation contact list outside this doc.

---

## 17. Disaster recovery

| Item | Target / practice |
| --- | --- |
| **Firestore exports** | Daily prod → GCS; access-controlled |
| **Storage backups** | Versioning + periodic backup |
| **RPO** | ≤ 24 hours for catalog (daily export); tighter if business requires later |
| **RTO** | Define per severity; goal: restore public read path quickly via Hosting + last-good data |
| **Recovery tests** | At least annual restore exercise |
| **Region strategy** | Prefer multi-region Firestore for prod when budget allows |

---

## 18. Privacy

### 18.1 KVKK (primary)

| Topic | Spec |
| --- | --- |
| Lawful basis | Consent for lead sharing with institutions; transparency texts |
| Disclosure | Privacy policy (`/privacy`) in Turkish |
| Processors | Document sub-processors (Firebase/Google, email, analytics) |
| Data minimization | Collect only PRD-required lead fields |
| Access control | Strict AuthZ on PII collections |

### 18.2 GDPR compatibility

Design for GDPR-aligned rights where applicable (access, deletion, portability concepts)—even if primary market is Türkiye—so Atlas OS products can expand.

### 18.3 Cookies & tracking

| Topic | Spec |
| --- | --- |
| Cookie policy | Disclose analytics/essential cookies |
| Consent | Non-essential analytics gated as required by policy counsel |
| Prefer | Privacy-friendly configuration; no PII in GA events |

### 18.4 Retention & deletion

| Data | Retention guidance |
| --- | --- |
| Leads | Defined window (e.g. 12–24 months) then anonymize/delete — finalize with counsel |
| Claim documents | Retain while claim active + limited period after reject |
| Auth accounts | Delete/anonymize on verified request |
| Audit logs | Longer retention for security |
| Backups | Expire on schedule; deletion follows backup cycle |

**Right to deletion:** Supportable process via Admin tools + scheduled purge jobs; document SLA.

---

## 19. Atlas CLI security (reusable generators)

Security mechanisms that **should become Atlas CLI generators / templates** for EduAtlas and future Atlas OS products:

| Generator / template | Produces |
| --- | --- |
| **Security headers** | Baseline `Content-Security-Policy`, `frame-ancestors`, `nosniff`, `referrer-policy`, HSTS (Hosting/Next config stubs) |
| **CSP policy pack** | Strict default-src templates with nonce/hash guidance |
| **Rate limiting module** | Middleware/Function wrapper patterns + config schema |
| **Firebase Rules stubs** | Deny-default Rules + public-read published pattern + PII collections locked |
| **Storage Rules stubs** | Public media vs private docs paths |
| **Validation package** | Shared schema kit + lead/auth examples |
| **App Check wiring** | Callable enforcement helper |
| **Audit logging** | Structured audit event helper + required event enum |
| **Auth RBAC claims** | Role claim set/verify utilities (server-only) |
| **Upload pipeline** | Temp → validate → reencode → finalize path |
| **Security checklist** | CI job marking release gates |
| **robots/noindex private** | Disallow owner/admin/auth routes |

CLI must **never** embed real secrets in generated code.

---

## 20. Future controls

| Control | Intent |
| --- | --- |
| **Passkeys** | Phishing-resistant owner/admin login |
| **Hardware keys** | Super Admin requirement |
| **Advanced MFA** | Step-up for exports/role changes |
| **AI threat detection** | Anomaly scoring on leads/claims/traffic |
| **Automated security audit** | Scheduled Rules tests, dependency scans, CSP reports |
| **WAF / bot management** | Edge policies at scale |
| **Customer-managed encryption** | If enterprise tenants require |

---

## 21. Production readiness checklist

### 21.1 Identity & access

- [ ] Email verification enforced for owners/admins  
- [ ] Password policy enabled  
- [ ] Custom claims only via Admin SDK Functions  
- [ ] At least one Super Admin; recovery path documented  
- [ ] Admin sessions hardened (reauth for destructive)  

### 21.2 Firebase & app

- [ ] Firestore Rules deny-default; emulator tests green  
- [ ] Storage Rules: claim docs private  
- [ ] App Check enforced in prod on public writes  
- [ ] Lead/contact create not openly writable from client Rules  
- [ ] Secrets in Secret Manager / CI — none in repo  

### 21.3 Application security

- [ ] Shared server-side validation on all writes  
- [ ] CSP + security headers active  
- [ ] CSRF protections verified for Server Actions  
- [ ] Upload allowlist + size limits + image re-encode  
- [ ] Rate limits on auth, leads, claims  

### 21.4 Privacy

- [ ] Privacy & terms published  
- [ ] Lead consent captured + policy version stored  
- [ ] Retention jobs defined  
- [ ] Analytics PII scrubbed  

### 21.5 Ops

- [ ] Audit logging for admin/claim/publish  
- [ ] Alerts for failed login / function / lead spikes  
- [ ] Daily Firestore export configured  
- [ ] Incident response contacts listed  
- [ ] Dependency audit in CI  
- [ ] Protected branch + prod approval  

### 21.6 Abuse / trust

- [ ] Claim manual verification path live  
- [ ] Spam mark on leads  
- [ ] Publish gates prevent empty/fake thin SEO spam  
- [ ] robots.txt blocks private surfaces  

---

## 22. Secure defaults (Atlas OS baseline)

Any new Atlas OS product generated from this baseline should ship with:

1. Deny-default data rules  
2. RBAC claims server-side  
3. App Check on anonymous writes  
4. Validation package wired  
5. Security headers + CSP template  
6. Audit log helper  
7. Rate-limit helper  
8. Private vs public storage split  
9. Env separation  
10. Production checklist gate in CI  

---

## 23. Approval

| Role | Name | Date | Sign-off |
| --- | --- | --- | --- |
| Security / Engineering | | | ☐ |
| Product | | | ☐ |
| Privacy / Legal | | | ☐ |
| Operations | | | ☐ |

**Summary:** EduAtlas is **secure by default** through least-privilege RBAC, Zero Trust enforcement at Functions/Rules, defense-in-depth against abuse and classic web threats, classified data handling with KVKK-aligned privacy, auditable admin actions, and **Atlas CLI–reusable** security templates—protecting users, institutions, administrators, platform data, and infrastructure.
