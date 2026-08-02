# Organization Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use `- [ ]` checkboxes for tracking.

**Goal:** Full Schema.org Organization for EduAtlas on the home page only via SchemaEngine.

**Architecture:** Extend SeoSiteConfig optionals; OrganizationSchemaBuilder emits required + known fields and omits unset contacts/sameAs; home adapter passes metadata description.

**Tech Stack:** TypeScript, Vitest, existing SchemaEngine registry.

---

### Task 1: SiteConfig + constants + builder

- [x] Optional org fields on SeoSiteConfig
- [x] ORGANIZATION_KNOWS_ABOUT / EDUATLAS_ALTERNATE_NAME
- [x] OrganizationSchemaBuilder full output

### Task 2: Wire + verify

- [x] homeSchemaAdapter passes description
- [x] Tests + typecheck
