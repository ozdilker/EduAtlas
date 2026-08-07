# GROWTH-001 Phase 1 — Growth Center Design

**Date:** 2026-08-07  
**Route:** `/admin/outreach` (unchanged)  
**Goal:** First 100 claimed institutions — operate prepare, control, send, and monitor from one screen.

## Scope

Phase 1 turns the existing Kampanyalar screen into **EduAtlas Growth Center** UI/orchestration on top of OUTREACH-002/003.

**In scope:** campaign list filters, 10-step wizard shell, campaign summary (real counters), quality score, live delivery + progress bar, audit log UI.

**Out of scope (Phase 2):** rich Recipient Explorer columns, bulk recipient add/exclude/re-add, claim/premium ETA forecasts.

## Non-negotiables

- Domain statuses unchanged: `draft | ready | running | paused | completed | cancelled | failed`.
- Prepare is a workflow action; campaign stays `draft` after prepare.
- Approve: `draft → ready`. Run only when `ready`.
- Archive is UI-only: `completed | cancelled | failed`.
- Do not change EMDS, SMTP, or Delivery Engine core.
- No new top-level admin module; no `/admin/campaigns` route.

## Layout

```
┌ Left: filtered list ─┬─ Center: wizard + live delivery ─┬─ Right: summary + quality + audit ┐
```

### Left panel buckets (derived)

| Label | Rule |
| --- | --- |
| Taslak | `draft` && recipientCount === 0 |
| Hazırlandı | `draft` && recipientCount > 0 |
| Hazır | `ready` |
| Çalışıyor | `running` \|\| `paused` |
| Tamamlandı | `completed` |
| İptal | `cancelled` |
| Arşiv | `completed` \|\| `cancelled` \|\| `failed` |

### Wizard steps

1. Genel bilgiler  
2. Template  
3. Segment  
4. Recipient preview (segment match sample; no jobs)  
5. Mail preview  
6. Test mail (bypasses DeliveryJob queue)  
7. Prepare (recipients + jobs; status remains `draft`)  
8. Review  
9. Approve (`draft → ready`)  
10. Run (+ live delivery)

### Summary (right)

- Segment match count  
- Prepared recipient count  
- Warmup batch size  
- Progress totals  
- No claim/premium estimates  

### Quality score

Pure 0–100 heuristic over subject, preheader, CTA, spam words, body length, template presence, `{{institutionName}}` personalization.

### Live delivery

Job status map: Queued (`pending`), Locked (`locked`), Sent, Failed/Retry, Bounce; progress bar from percent.

### Audit log

Surface existing `CampaignLog` writes via `listByCampaignId`.

## Lifecycle

```
draft → Prepare (stays draft, recipients+jobs)
     → Approve → ready
     → Run → running ↔ paused
     → completed | cancelled | failed
```
