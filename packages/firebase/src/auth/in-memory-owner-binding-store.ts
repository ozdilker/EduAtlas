import {
  createInMemoryOwnerBindingRepository,
  type OwnerBindingRepository,
} from "@eduatlas/application";
import type { OwnerBinding } from "@eduatlas/domain";

export type { OwnerBinding, OwnerBindingRepository };

/**
 * Re-export wrapper kept under firebase/auth for composition roots that expect
 * an identity adapter surface. Starts empty — no auto-bind on login.
 */
export function createEmptyOwnerBindingRepository(): OwnerBindingRepository {
  return createInMemoryOwnerBindingRepository();
}
