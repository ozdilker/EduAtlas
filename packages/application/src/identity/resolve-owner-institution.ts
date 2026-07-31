import type { OwnerBindingRepository } from "./owner-binding-repository";

export type ResolveOwnerInstitutionInput = {
  userId: string;
};

export type ResolveOwnerInstitutionDependencies = {
  ownerBindingRepository: OwnerBindingRepository;
  /**
   * Dev-only seed institution. Never used as an automatic bind for production auth.
   * Returned only when explicitly enabled by the web composition root.
   */
  demoInstitutionId?: string;
  allowDemoInstitutionFallback?: boolean;
};

export type ResolveOwnerInstitutionResult = Readonly<{
  readonly institutionId: string | null;
  readonly source: "binding" | "demo" | "unbound";
}>;

/**
 * Resolves the institution an authenticated owner may manage.
 * Does not create bindings. Demo seed stays isolated behind an explicit flag.
 */
export async function resolveOwnerInstitutionId(
  input: ResolveOwnerInstitutionInput,
  deps: ResolveOwnerInstitutionDependencies,
): Promise<ResolveOwnerInstitutionResult> {
  const userId = input.userId.trim();
  if (!userId) {
    return Object.freeze({ institutionId: null, source: "unbound" as const });
  }

  const binding = await deps.ownerBindingRepository.findApprovedByUserId(userId);
  if (binding) {
    return Object.freeze({
      institutionId: binding.institutionId,
      source: "binding" as const,
    });
  }

  if (deps.allowDemoInstitutionFallback && deps.demoInstitutionId?.trim()) {
    return Object.freeze({
      institutionId: deps.demoInstitutionId.trim(),
      source: "demo" as const,
    });
  }

  return Object.freeze({ institutionId: null, source: "unbound" as const });
}
