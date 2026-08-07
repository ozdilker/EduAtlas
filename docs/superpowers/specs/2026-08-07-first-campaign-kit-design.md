# PRD-GROWTH-003 — First Campaign Kit

| Field | Value |
| --- | --- |
| **Date** | 2026-08-07 |
| **Status** | Approved |
| **Scope** | Content, seeds, checklists, ops UI — no delivery infra |

## Decisions

- Campaign document fields: `preSendChecklist`, `execution`, `postSummary`, `learnings`
- Seed draft campaign (Claim Invitation + İstanbul segment)
- Pre-send checklist gates Run in UI (all true required)
- Recipient checklist is derived after Prepare (not separately persisted)
- No separate learnings collection

## Non-goals

Delivery engine, SMTP, queue, warm-up, EMDS changes.
