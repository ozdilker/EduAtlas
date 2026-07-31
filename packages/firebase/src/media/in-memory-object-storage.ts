import type { ObjectStorage, ObjectStoragePutInput } from "@eduatlas/application";

/**
 * In-memory ObjectStorage for local/CI — no Firebase Storage required.
 */
export class InMemoryObjectStorage implements ObjectStorage {
  readonly objects = new Map<string, { data: Uint8Array; contentType: string }>();

  async put(input: ObjectStoragePutInput) {
    this.objects.set(input.path, {
      data: new Uint8Array(input.data),
      contentType: input.contentType,
    });
    return { path: input.path, url: `memory://${input.path}` };
  }

  async delete(path: string) {
    this.objects.delete(path);
  }

  async getUrl(path: string) {
    return `memory://${path}`;
  }
}

export function createInMemoryObjectStorage(): ObjectStorage {
  return new InMemoryObjectStorage();
}
