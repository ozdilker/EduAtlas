/**
 * Lifecycle of a media asset.
 * Foundation: uploads land as Ready (no moderation pipeline yet).
 */
export enum MediaStatus {
  Pending = "pending",
  Ready = "ready",
  Deleted = "deleted",
}

const STATUS_SET = new Set<string>(Object.values(MediaStatus));

export function isMediaStatus(value: string): value is MediaStatus {
  return STATUS_SET.has(value);
}

export function parseMediaStatus(value: string): MediaStatus {
  if (!isMediaStatus(value)) {
    throw new Error(`Unknown MediaStatus: ${value}`);
  }
  return value;
}

export function isActiveMediaStatus(status: MediaStatus): boolean {
  return status === MediaStatus.Ready || status === MediaStatus.Pending;
}
