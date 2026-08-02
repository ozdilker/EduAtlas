# PRD-OUTREACH-002 — Campaign Builder & HTML Mail

| Field | Value |
| --- | --- |
| **Date** | 2026-08-02 |
| **Status** | Approved (conversation) |
| **Persistence** | Process-local in-memory singleton (Option A) |

## Goal

Admin can create the first outreach email campaign, preview it via EMDS, and send a **test email** to themselves. **Bulk campaign start is forbidden** in this PRD.

## Non-goals

- Bulk send / start campaign for all recipients
- Campaign analytics UI
- Reminder / Premium / Newsletter templates
- SMS / WhatsApp
- Firestore persistence
- Changes to Claim / Lead / Google Sync systems

## Philosophy

Every campaign must be human-checked (preview + test) before any future bulk send PRD.

## Seed data

### Template — Institution Claim Invitation

- EMDS-only composition: title, subtitle, info card, benefits list, **single CTA** “Kurum Panelini Aç”, footer
- Default subject (admin-editable)
- Preheader supported
- Personalization in v1: `{{institutionName}}` only  
  (Future tokens documented but not implemented: city, category, leadCount, googleRating, ownerName)

### Segment — İstanbul unclaimed with email

Filters: `cityId` = Istanbul, `verification` = unclaimed, `hasEmail` = true

## Application additions

| Capability | Behavior |
| --- | --- |
| `renderClaimInvitationMail` | Builds EMDS HTML from template + subject/preheader overrides + `institutionName` |
| `sendCampaignTestEmail` | Exactly one recipient (admin-entered address); may use queue for one job; calls `EmailService`; does **not** set campaign to `running` |
| Campaign create/update | name, description, templateId, segmentId, subject, preheader; validation: subject + template + segment required |
| Bulk start | Not exposed |

## Admin UI

- Nav item **Kampanyalar** → `/admin/outreach`
- Builder: name, description, template select, segment select, subject, preheader
- Preview (rendered HTML)
- Test send (email field + button)
- No “Kampanyayı başlat” control

## Infrastructure

- Web process singleton wrapping OUTREACH-001 in-memory repos/queue
- Server actions for save / preview / testSend
- Reuse existing SMTP / Console `EmailService`

## Acceptance

- [x] Design approved in conversation
- [x] Campaign creatable from admin
- [x] EMDS used; Claim Invitation template ready
- [x] Preview works
- [x] Test mail sendable; subject + preheader editable
- [x] `{{institutionName}}` works
- [x] No bulk send
- [x] Typecheck passes; existing systems intact

## Follow-ups

- Firestore
- Bulk start + rate limits
- Additional templates / tokens
- Analytics screens
