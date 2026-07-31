/**
 * Opaque district identity value object.
 */
export type DistrictId = Readonly<{
  readonly value: string;
}>;

const DISTRICT_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

export function createDistrictId(raw: string): DistrictId {
  const value = raw.trim();
  if (!DISTRICT_ID_PATTERN.test(value)) {
    throw new Error("DistrictId must be 1–128 URL-safe characters.");
  }
  return Object.freeze({ value });
}

export function districtIdAsString(id: DistrictId): string {
  return id.value;
}

export function districtIdsEqual(left: DistrictId, right: DistrictId): boolean {
  return left.value === right.value;
}
