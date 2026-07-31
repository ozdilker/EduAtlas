type TtlEntry<V> = Readonly<{
  expiresAtMs: number;
  value?: V;
  promise?: Promise<V>;
}>;

/**
 * Simple in-memory TTL cache with async de-duplication.
 *
 * - If a load is in-flight for the same key, all callers await the same promise.
 * - Once TTL expires, the next caller refreshes the value.
 */
export class TtlCache<V> {
  private readonly entries = new Map<string, TtlEntry<V>>();

  constructor(private readonly defaultTtlMs: number) {}

  clear(): void {
    this.entries.clear();
  }

  clearKey(key: string): void {
    this.entries.delete(key);
  }

  async getOrLoad(key: string, load: () => Promise<V>, ttlMs?: number): Promise<V> {
    const now = Date.now();
    const entry = this.entries.get(key);

    if (entry) {
      if (entry.expiresAtMs > now) {
        if (entry.promise) return entry.promise;
        if (entry.value !== undefined) return entry.value;
      }
    }

    const ttl = ttlMs ?? this.defaultTtlMs;
    const promise = load();
    this.entries.set(key, {
      expiresAtMs: now + ttl,
      promise,
    });

    try {
      const value = await promise;
      this.entries.set(key, {
        expiresAtMs: Date.now() + ttl,
        value,
      });
      return value;
    } catch (error) {
      // Ensure failed loads don't poison the cache.
      this.entries.delete(key);
      throw error;
    }
  }
}

