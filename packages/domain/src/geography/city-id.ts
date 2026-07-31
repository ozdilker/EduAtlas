/**
 * Opaque city identity value object.
 */
export type CityId = Readonly<{
  readonly value: string;
}>;

const CITY_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

export function createCityId(raw: string): CityId {
  const value = raw.trim();
  if (!CITY_ID_PATTERN.test(value)) {
    throw new Error("CityId must be 1–128 URL-safe characters.");
  }
  return Object.freeze({ value });
}

export function cityIdAsString(id: CityId): string {
  return id.value;
}

export function cityIdsEqual(left: CityId, right: CityId): boolean {
  return left.value === right.value;
}
