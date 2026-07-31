/**
 * Geography reference lifecycle (City / District).
 */
export enum GeoLifecycleStatus {
  Published = "published",
  Archived = "archived",
}

const GEO_LIFECYCLE_STATUS_VALUES: ReadonlySet<string> = new Set(Object.values(GeoLifecycleStatus));

export function isGeoLifecycleStatus(value: string): value is GeoLifecycleStatus {
  return GEO_LIFECYCLE_STATUS_VALUES.has(value);
}

export function parseGeoLifecycleStatus(raw: string): GeoLifecycleStatus {
  const value = raw.trim();
  if (!isGeoLifecycleStatus(value)) {
    throw new Error(`Unknown GeoLifecycleStatus: ${raw}`);
  }
  return value;
}

export function isPublishedGeoLifecycle(status: GeoLifecycleStatus): boolean {
  return status === GeoLifecycleStatus.Published;
}
