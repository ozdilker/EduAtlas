import {
  createInMemoryOutreachQueue,
  createInMemoryOutreachStores,
  createOutreachService,
  ensureOutreachSeeds,
  type OutreachService,
} from "@eduatlas/application";

type OutreachRuntime = Readonly<{
  stores: ReturnType<typeof createInMemoryOutreachStores>;
  queue: ReturnType<typeof createInMemoryOutreachQueue>;
  service: OutreachService;
  seeded: Promise<void>;
}>;

declare global {
  // eslint-disable-next-line no-var
  var __eduatlasOutreachRuntime: OutreachRuntime | undefined;
}

/**
 * Process-local OUTREACH singleton (Option A — no Firestore).
 */
function getOutreachRuntime(): OutreachRuntime {
  if (!globalThis.__eduatlasOutreachRuntime) {
    const stores = createInMemoryOutreachStores();
    const queue = createInMemoryOutreachQueue();
    const service = createOutreachService({ ...stores, queue });
    const seeded = ensureOutreachSeeds({
      templateRepository: stores.templateRepository,
      segmentRepository: stores.segmentRepository,
    });
    globalThis.__eduatlasOutreachRuntime = { stores, queue, service, seeded };
  }
  return globalThis.__eduatlasOutreachRuntime;
}

export async function getOutreachService(): Promise<OutreachService> {
  const runtime = getOutreachRuntime();
  await runtime.seeded;
  return runtime.service;
}

export async function getOutreachStores(): Promise<
  ReturnType<typeof createInMemoryOutreachStores>
> {
  const runtime = getOutreachRuntime();
  await runtime.seeded;
  return runtime.stores;
}
