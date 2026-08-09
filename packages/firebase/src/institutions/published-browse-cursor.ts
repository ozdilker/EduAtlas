/**
 * Opaque cursor for public published-institution browse (Firestore startAfter).
 * Encodes qualityScore + document id for stable qualityScore DESC, __name__ ASC paging.
 */

export type PublishedBrowseCursorValue = Readonly<{
  readonly qualityScore: number;
  readonly id: string;
}>;

type CursorPayloadV1 = Readonly<{
  readonly v: 1;
  readonly q: number;
  readonly id: string;
}>;

/**
 * Encodes a browse cursor for URLs / API clients.
 */
export function encodePublishedBrowseCursor(cursor: PublishedBrowseCursorValue): string {
  const payload: CursorPayloadV1 = Object.freeze({
    v: 1,
    q: cursor.qualityScore,
    id: cursor.id.trim(),
  });
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

/**
 * Decodes a browse cursor. Returns null when malformed.
 */
export function decodePublishedBrowseCursor(
  raw: string | null | undefined,
): PublishedBrowseCursorValue | null {
  const value = raw?.trim();
  if (!value) return null;
  try {
    const json = Buffer.from(value, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as Partial<CursorPayloadV1>;
    if (parsed.v !== 1 || typeof parsed.q !== "number" || typeof parsed.id !== "string") {
      return null;
    }
    const id = parsed.id.trim();
    if (!id || !Number.isFinite(parsed.q)) return null;
    return Object.freeze({ qualityScore: parsed.q, id });
  } catch {
    return null;
  }
}
