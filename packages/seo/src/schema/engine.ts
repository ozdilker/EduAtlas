import type { JsonLdObject, SeoSiteConfig } from "../types";
import { defaultSchemaRegistry, type SchemaRegistry } from "./registry";
import type { SchemaInputMap, SchemaPageKind } from "./types";

export type SchemaEngineOptions = {
  registry?: SchemaRegistry;
};

/**
 * Central structured-data facade.
 * Pages / page SEO builders request JSON-LD here — never assemble graphs inline.
 */
export const SchemaEngine = {
  build<K extends SchemaPageKind>(
    kind: K,
    site: SeoSiteConfig,
    input: SchemaInputMap[K] = {} as SchemaInputMap[K],
    options: SchemaEngineOptions = {},
  ): readonly JsonLdObject[] {
    const registry = options.registry ?? defaultSchemaRegistry;
    const builder = registry.get(kind);
    if (!builder) {
      return Object.freeze([]);
    }
    return builder.build({ site, input });
  },

  kinds(options: SchemaEngineOptions = {}): readonly SchemaPageKind[] {
    const registry = options.registry ?? defaultSchemaRegistry;
    return registry.kinds();
  },
} as const;
