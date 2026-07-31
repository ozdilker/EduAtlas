/**
 * Prepared claim → owner user binding (Identity Foundation).
 * Not auto-created on login or claim submit — Admin approval writes this later.
 */
export type OwnerBindingStatus = "pending" | "approved" | "revoked";

export type OwnerBinding = Readonly<{
  readonly userId: string;
  readonly institutionId: string;
  readonly status: OwnerBindingStatus;
  readonly requestedAt: string;
  readonly approvedAt?: string;
}>;

export type CreateOwnerBindingInput = {
  userId: string;
  institutionId: string;
  status: OwnerBindingStatus;
  requestedAt: string;
  approvedAt?: string;
};

export function createOwnerBinding(input: CreateOwnerBindingInput): OwnerBinding {
  const userId = input.userId.trim();
  const institutionId = input.institutionId.trim();

  if (!userId) throw new Error("OwnerBinding.userId is required.");
  if (!institutionId) throw new Error("OwnerBinding.institutionId is required.");
  if (Number.isNaN(Date.parse(input.requestedAt))) {
    throw new Error("OwnerBinding.requestedAt must be a valid ISO timestamp.");
  }
  if (input.approvedAt !== undefined && Number.isNaN(Date.parse(input.approvedAt))) {
    throw new Error("OwnerBinding.approvedAt must be a valid ISO timestamp.");
  }

  return Object.freeze({
    userId,
    institutionId,
    status: input.status,
    requestedAt: input.requestedAt,
    ...(input.approvedAt ? { approvedAt: input.approvedAt } : {}),
  });
}

export function isApprovedOwnerBinding(binding: OwnerBinding): boolean {
  return binding.status === "approved";
}
