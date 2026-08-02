import type { SchemaBuilder, SchemaPageKind } from "./types";
import { DEFAULT_SCHEMA_ADAPTERS } from "./adapters";

/**
 * Mutable registry — new page kinds / builders register without editing callers.
 */
export class SchemaRegistry {
  private readonly builders = new Map<SchemaPageKind, SchemaBuilder>();

  constructor(seed: Iterable<SchemaBuilder> = Object.values(DEFAULT_SCHEMA_ADAPTERS)) {
    for (const builder of seed) {
      this.register(builder);
    }
  }

  register(builder: SchemaBuilder): void {
    this.builders.set(builder.kind, builder);
  }

  get<K extends SchemaPageKind>(kind: K): SchemaBuilder<K> | undefined {
    return this.builders.get(kind) as SchemaBuilder<K> | undefined;
  }

  has(kind: SchemaPageKind): boolean {
    return this.builders.has(kind);
  }

  kinds(): readonly SchemaPageKind[] {
    return Object.freeze([...this.builders.keys()]);
  }
}

export const defaultSchemaRegistry = new SchemaRegistry();
