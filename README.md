# EduAtlas

Monorepo for Türkiye's education discovery platform.

## Design Kit

Visual source of truth (documentation & asset specs — not application code):

- [`DESIGN-KIT.md`](./DESIGN-KIT.md) — governance, naming, exports
- [`VISUAL-REFERENCE.md`](./VISUAL-REFERENCE.md) — official visual specification
- [`design-kit/`](./design-kit/) — asset library structure & 81 city specs

**Rule:** Approved kit assets are implemented as-is. Do not invent new UI visuals.

## Structure

```text
apps/web                 Next.js App Router application
packages/application     Application use cases
packages/config          Environment configuration
packages/domain          Domain layer
packages/firebase        Firebase infrastructure (client/admin)
packages/types           Shared types
packages/ui              Shared UI package
packages/utils           Shared utilities
packages/validation      Shared validation schemas
design-kit               Permanent Design Kit (assets & specs)
```

## Commands

```bash
npm install
npm run dev
npm run build
npm run typecheck
npm run lint
npm run test
```

Copy `.env.example` to `apps/web/.env.local` for local development.
