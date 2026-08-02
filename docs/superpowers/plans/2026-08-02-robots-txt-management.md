# Robots.txt Implementation Plan

> Spec: `docs/superpowers/specs/2026-08-02-robots-txt-management-design.md`

**Goal:** Dynamic `/robots.txt` from modular SEO policy; crawl only when `EDUATLAS_ALLOW_ROBOTS=true`.

## Tasks

- [x] Task 1: `@eduatlas/seo` robots module + tests
- [x] Task 2: `apps/web/src/app/robots.ts` thin adapter + env parse
- [x] Task 3: typecheck + test
