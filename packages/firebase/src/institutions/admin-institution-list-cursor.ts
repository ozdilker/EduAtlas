/**
 * Opaque cursor for admin institution list (Firestore startAfter).
 * Encodes sort-field value(s) + document id for stable paging.
 */

import type { InstitutionAdminListSort } from "@eduatlas/application";

export type AdminInstitutionListCursorValue = Readonly<{
  readonly sort: InstitutionAdminListSort;
  readonly name?: string;
  readonly createdAt?: string;
  readonly qualityScore?: number;
  readonly id: string;
}>;

type CursorPayloadV1 = Readonly<{
  readonly v: 1;
  readonly sort: InstitutionAdminListSort;
  readonly name?: string;
  readonly createdAt?: string;
  readonly qualityScore?: number;
  readonly id: string;
}>;

/**
 * Encodes an admin list cursor for URLs / server loaders.
 */
export function encodeAdminInstitutionListCursor(cursor: AdminInstitutionListCursorValue): string {
  const payload: CursorPayloadV1 = Object.freeze({
    v: 1,
    sort: cursor.sort,
    ...(cursor.name !== undefined ? { name: cursor.name } : {}),
    ...(cursor.createdAt !== undefined ? { createdAt: cursor.createdAt } : {}),
    ...(cursor.qualityScore !== undefined ? { qualityScore: cursor.qualityScore } : {}),
    id: cursor.id.trim(),
  });
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

/**
 * Decodes an admin list cursor. Returns null when malformed or sort mismatch.
 */
export function decodeAdminInstitutionListCursor(
  raw: string | null | undefined,
  expectedSort?: InstitutionAdminListSort,
): AdminInstitutionListCursorValue | null {
  const value = raw?.trim();
  if (!value) return null;
  try {
    const json = Buffer.from(value, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as Partial<CursorPayloadV1>;
    if (parsed.v !== 1 || typeof parsed.sort !== "string" || typeof parsed.id !== "string") {
      return null;
    }
    const id = parsed.id.trim();
    if (!id) return null;
    if (expectedSort && parsed.sort !== expectedSort) return null;

    const sort = parsed.sort as InstitutionAdminListSort;
    if (sort === "name_asc" || sort === "name_desc") {
      if (typeof parsed.name !== "string") return null;
      return Object.freeze({ sort, name: parsed.name, id });
    }
    if (sort === "created_desc") {
      if (typeof parsed.createdAt !== "string" || !parsed.createdAt.trim()) return null;
      return Object.freeze({ sort, createdAt: parsed.createdAt, id });
    }
    if (sort === "quality_desc" || sort === "quality_asc") {
      if (typeof parsed.qualityScore !== "number" || !Number.isFinite(parsed.qualityScore)) {
        return null;
      }
      return Object.freeze({ sort, qualityScore: parsed.qualityScore, id });
    }
    return null;
  } catch {
    return null;
  }
}
