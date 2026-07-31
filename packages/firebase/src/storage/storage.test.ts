import { describe, expect, it } from "vitest";
import { mapStorageError, StorageServiceError } from "./errors";
import { storagePaths } from "./path-builder";
import { createUniqueStorageFileName, joinStoragePath } from "./unique-file-name";

describe("storagePaths", () => {
  it("builds institution directories without duplicated string literals", () => {
    expect(storagePaths.institutionLogo("inst_1")).toBe("institutions/inst_1/logo");
    expect(storagePaths.institutionCover("inst_1")).toBe("institutions/inst_1/cover");
    expect(storagePaths.institutionGallery("inst_1")).toBe("institutions/inst_1/gallery");
    expect(storagePaths.institutionDocuments("inst_1")).toBe("institutions/inst_1/documents");
    expect(storagePaths.institutionObject("inst_1", "logo", "a.png")).toBe(
      "institutions/inst_1/logo/a.png",
    );
  });

  it("builds institution image variant paths for delivery sizes", () => {
    expect(
      storagePaths.institutionImageVariantDirectory("inst_1", "logo", "thumb_200"),
    ).toBe("institutions/inst_1/logo/thumb_200");
    expect(
      storagePaths.institutionImageVariantObject("inst_1", "logo", "thumb_200", "a.png"),
    ).toBe("institutions/inst_1/logo/thumb_200/a.png");
  });

  it("builds profile and news directories for future modules", () => {
    expect(storagePaths.userProfile("uid_1")).toBe("users/uid_1/profile");
    expect(storagePaths.newsImages("news_1")).toBe("news/news_1/images");
  });

  it("rejects empty or nested id segments", () => {
    expect(() => storagePaths.institutionLogo("")).toThrow(/institutionId/);
    expect(() => storagePaths.institutionLogo("a/b")).toThrow(/single path segment/);
  });
});

describe("createUniqueStorageFileName", () => {
  it("preserves a sanitized extension and generates a unique stem", () => {
    const first = createUniqueStorageFileName("Logo.PNG");
    const second = createUniqueStorageFileName("Logo.PNG");

    expect(first).toMatch(/^[a-z0-9]+_[a-z0-9]+\.png$/);
    expect(second).toMatch(/^[a-z0-9]+_[a-z0-9]+\.png$/);
    expect(first).not.toBe(second);
  });

  it("falls back to bin when extension is missing", () => {
    expect(createUniqueStorageFileName("readme")).toMatch(/\.bin$/);
  });
});

describe("joinStoragePath", () => {
  it("joins directory and file name", () => {
    expect(joinStoragePath("institutions/inst_1/logo/", "/file.png")).toBe(
      "institutions/inst_1/logo/file.png",
    );
  });
});

describe("mapStorageError", () => {
  it("maps known Firebase Storage codes", () => {
    const error = mapStorageError({ code: "storage/object-not-found", message: "missing" });
    expect(error).toBeInstanceOf(StorageServiceError);
    expect(error.code).toBe("STORAGE_NOT_FOUND");
    expect(error.firebaseCode).toBe("object-not-found");
  });

  it("passes through StorageServiceError instances", () => {
    const original = new StorageServiceError("STORAGE_CANCELED", "iptal");
    expect(mapStorageError(original)).toBe(original);
  });
});
