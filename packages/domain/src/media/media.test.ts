import { describe, expect, it } from "vitest";
import {
  createMediaAsset,
  MEDIA_MAX_BYTE_SIZE,
  MediaStatus,
  MediaType,
  MediaVariantKind,
  mediaAssetPrimaryUrl,
  validateMediaUpload,
} from "../index";

describe("media domain", () => {
  it("creates a media asset with original variant", () => {
    const asset = createMediaAsset({
      id: "media_1",
      institutionId: "inst_1",
      type: MediaType.Logo,
      status: MediaStatus.Ready,
      isPrimary: true,
      originalFileName: "logo.png",
      contentType: "image/png",
      byteSize: 1024,
      variants: [
        {
          kind: MediaVariantKind.Original,
          storagePath: "institutions/inst_1/logo/media_1.png",
          url: "https://cdn.example.com/logo.png",
          byteSize: 1024,
          contentType: "image/png",
        },
      ],
      createdAt: "2026-07-15T12:00:00.000Z",
      updatedAt: "2026-07-15T12:00:00.000Z",
    });

    expect(asset.type).toBe(MediaType.Logo);
    expect(mediaAssetPrimaryUrl(asset)).toBe("https://cdn.example.com/logo.png");
  });

  it("validates allowed formats, size, and count limits", () => {
    expect(
      validateMediaUpload({
        contentType: "image/jpeg",
        byteSize: 1000,
        type: MediaType.Gallery,
        currentCountForType: 0,
      }).ok,
    ).toBe(true);

    expect(
      validateMediaUpload({
        contentType: "image/svg+xml",
        byteSize: 1000,
        type: MediaType.Logo,
        currentCountForType: 0,
      }).ok,
    ).toBe(false);

    expect(
      validateMediaUpload({
        contentType: "image/png",
        byteSize: MEDIA_MAX_BYTE_SIZE + 1,
        type: MediaType.Cover,
        currentCountForType: 0,
      }).ok,
    ).toBe(false);

    expect(
      validateMediaUpload({
        contentType: "image/webp",
        byteSize: 1000,
        type: MediaType.Logo,
        currentCountForType: 1,
      }).ok,
    ).toBe(false);
  });
});
