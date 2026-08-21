# Growth-004 External Recipient Import Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** Wire Excel/CSV external recipients into Growth Center without rewriting DeliveryJob pipeline.

**Architecture:** Synthetic `ext:{hash}` institution ids + `displayName` on recipients; shared enqueue helper; segment prepare unchanged.

**Tech Stack:** Existing xlsx/csv parsers, Firestore outreach collections, Growth Center wizard.

## Global Constraints

- Do not store Excel files in Firestore
- Do not rewrite DeliveryWorker / rate limit / warm-up
- Keep segment recipient path
- Prepare leaves campaign `draft`; Approve → `ready`

---

### Task 1: Domain extensions
- [ ] `displayName` on CampaignRecipient
- [ ] `recipientSource` + `importMeta` on Campaign
- [ ] `buildExternalInstitutionId(email)` helper
- [ ] Unit tests

### Task 2: Shared enqueue + import parse/prepare
- [ ] Extract `enqueuePreparedTargets` from prepare-campaign
- [ ] `parseOutreachRecipientImport` (institutionName, email; limits; injection hardening; dedupe)
- [ ] `prepareCampaignFromImport` use case
- [ ] OutreachService wiring

### Task 3: Delivery personalization
- [ ] EmailDeliveryHandler prefers `recipient.displayName`

### Task 4: Admin UI + actions
- [ ] Step 3 Segment | Excel/CSV
- [ ] Preview API + prepare import action
- [ ] Step 4 shows import preview rows

### Task 5: Tests
- [ ] Import validation/dedupe/prepare tests
- [ ] Handler displayName test
