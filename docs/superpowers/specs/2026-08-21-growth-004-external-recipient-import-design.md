# PRD-GROWTH-004 External Recipient Import Design

**Date:** 2026-08-21  
**Status:** Approved (approach A)

## Goal

Add Excel/CSV external recipient import to Growth Center (`/admin/outreach`) without rewriting the DeliveryJob pipeline.

## Decision

**Approach A:** Synthetic `institutionId` (`ext:{sha256(normalizedEmail).slice(0,24)}`) + optional `CampaignRecipient.displayName` for `{{institutionName}}`. Segment path unchanged.

## Domain

- `CampaignRecipient.displayName?: string` — from import `institutionName`
- `Campaign.recipientSource?: "segment" | "external_import"`
- `Campaign.importMeta?: { fileName, rowCount, acceptedCount, rejectedCount, duplicateEmailCount, importedAt }`
- Excel file itself is **not** stored in Firestore

## Flow

Import → Validation → Recipient Preview → Prepare → Review → Approve → Run  

Prepare stays draft; Approve draft→ready. Existing queue/lock/idempotency/rate-limit/retry/pause/resume/warm-up unchanged.

## Application

1. Parse/validate CSV/XLSX (required: `institutionName`, `email`); size/row limits; formula/HTML injection hardening; in-file duplicate email dedupe
2. Preview (no writes)
3. Shared `enqueuePreparedTargets` used by segment prepare + import prepare
4. Import prepare writes Queued recipients + Pending jobs; sets `execution.preparedAt`

## Delivery

`EmailDeliveryHandler`: `recipient.displayName` → else `resolveInstitutionName(institutionId)` → else `"Kurumunuz"`.

## UI

Step 3: Segment | Excel/CSV. Segment keeps current select. Import adds file upload + validation summary. Steps 4–10 reuse existing Prepare/Approve/Run.
