/**
 * Private institution contact channels — Admin SDK / trusted server only.
 * Never expose via public profile props, HTML, or JSON-LD without unlock.
 */
export type InstitutionPrivateContact = Readonly<{
  readonly institutionId: string;
  readonly phone?: string;
  readonly email?: string;
  readonly whatsappNumber?: string;
  readonly updatedAt: string;
}>;

export type UpsertInstitutionPrivateContactInput = Readonly<{
  readonly institutionId: string;
  readonly phone?: string | null;
  readonly email?: string | null;
  readonly whatsappNumber?: string | null;
  readonly updatedAt?: string;
}>;

export function createInstitutionPrivateContact(
  input: UpsertInstitutionPrivateContactInput,
): InstitutionPrivateContact {
  const institutionId = input.institutionId.trim();
  if (!institutionId) {
    throw new Error("InstitutionPrivateContact.institutionId is required.");
  }

  const phone = normalizeOptional(input.phone);
  const email = normalizeOptional(input.email)?.toLowerCase();
  const whatsappNumber = normalizeOptional(input.whatsappNumber);
  const updatedAt = input.updatedAt?.trim() || new Date().toISOString();

  return Object.freeze({
    institutionId,
    ...(phone ? { phone } : {}),
    ...(email ? { email } : {}),
    ...(whatsappNumber ? { whatsappNumber } : {}),
    updatedAt,
  });
}

function normalizeOptional(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
