/**
 * Institution media slots (Media Foundation).
 */
export enum MediaType {
  Logo = "logo",
  Cover = "cover",
  Gallery = "gallery",
}

export const MEDIA_TYPES: readonly MediaType[] = Object.freeze([
  MediaType.Logo,
  MediaType.Cover,
  MediaType.Gallery,
]);

const TYPE_SET = new Set<string>(MEDIA_TYPES);

export function isMediaType(value: string): value is MediaType {
  return TYPE_SET.has(value);
}

export function parseMediaType(value: string): MediaType {
  if (!isMediaType(value)) {
    throw new Error(`Unknown MediaType: ${value}`);
  }
  return value;
}
