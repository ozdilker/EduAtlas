import { createFirebaseClientStorageService } from "../storage/firebase-client-storage-service";
import type { StorageService } from "../storage/types";
import { getClientStorage } from "./providers";

/**
 * Convenience factory bound to the shared client Firebase Storage instance.
 */
export function getFirebaseClientStorageService(): StorageService {
  return createFirebaseClientStorageService(getClientStorage());
}
