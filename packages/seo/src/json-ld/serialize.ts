import type { JsonLdObject } from "../types";

/**
 * Serializes one or more JSON-LD objects for a script tag.
 * Escapes `<` to avoid breaking out of HTML script context.
 */
export function serializeJsonLd(data: JsonLdObject | JsonLdObject[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
