import { AsyncLocalStorage } from "node:async_hooks";

export type FirestoreReadWriteCounters = Readonly<{
  reads: number;
  writes: number;
}>;

type MutableCounters = {
  reads: number;
  writes: number;
};

const storage = new AsyncLocalStorage<MutableCounters>();

function getStore(): MutableCounters | undefined {
  return storage.getStore();
}

/**
 * Runs `fn` inside an AsyncLocalStorage context so Firestore read/write counts
 * can be accumulated per request/render.
 */
export async function runWithFirestoreCounters<T>(fn: () => Promise<T>): Promise<T> {
  const initial: MutableCounters = { reads: 0, writes: 0 };
  return storage.run(initial, fn);
}

export function countFirestoreRead(count: number = 1): void {
  const store = getStore();
  if (!store) return;
  store.reads += count;
}

export function countFirestoreWrite(count: number = 1): void {
  const store = getStore();
  if (!store) return;
  store.writes += count;
}

export function getFirestoreCounters(): FirestoreReadWriteCounters {
  const store = getStore();
  return Object.freeze({
    reads: store?.reads ?? 0,
    writes: store?.writes ?? 0,
  });
}

