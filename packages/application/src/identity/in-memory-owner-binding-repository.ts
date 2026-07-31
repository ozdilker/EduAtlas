import type { OwnerBinding } from "@eduatlas/domain";
import type { OwnerBindingRepository } from "./owner-binding-repository";

/**
 * In-memory owner binding store — empty by default (no auto-bind).
 */
export class InMemoryOwnerBindingRepository implements OwnerBindingRepository {
  private readonly bindings: OwnerBinding[] = [];

  constructor(initial: readonly OwnerBinding[] = []) {
    this.bindings.push(...initial);
  }

  async findApprovedByUserId(userId: string): Promise<OwnerBinding | null> {
    const key = userId.trim();
    return (
      this.bindings.find((binding) => binding.userId === key && binding.status === "approved") ??
      null
    );
  }

  async findApprovedByInstitutionId(institutionId: string): Promise<OwnerBinding | null> {
    const key = institutionId.trim();
    return (
      this.bindings.find(
        (binding) => binding.institutionId === key && binding.status === "approved",
      ) ?? null
    );
  }

  async listByUserId(userId: string): Promise<readonly OwnerBinding[]> {
    const key = userId.trim();
    return Object.freeze(this.bindings.filter((binding) => binding.userId === key));
  }

  async save(binding: OwnerBinding): Promise<OwnerBinding> {
    const index = this.bindings.findIndex(
      (item) =>
        item.userId === binding.userId && item.institutionId === binding.institutionId,
    );
    if (index >= 0) {
      this.bindings[index] = binding;
    } else {
      this.bindings.push(binding);
    }
    return binding;
  }

  /** Test/admin helper — not used by login flows. */
  seed(binding: OwnerBinding): void {
    this.bindings.push(binding);
  }
}

export function createInMemoryOwnerBindingRepository(
  initial?: readonly OwnerBinding[],
): InMemoryOwnerBindingRepository {
  return new InMemoryOwnerBindingRepository(initial);
}
