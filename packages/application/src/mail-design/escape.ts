/**
 * Escapes text for HTML element bodies.
 */
export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Escapes text for HTML attribute values.
 */
export function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll("'", "&#39;");
}
