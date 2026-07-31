/**
 * Contact channels for an institution.
 * DOMAIN-MODEL: at least one of phone or email is required to publish.
 */
export type InstitutionContact = Readonly<{
  readonly phone?: string;
  readonly email?: string;
  readonly whatsappNumber?: string;
}>;

export type CreateInstitutionContactInput = {
  phone?: string;
  email?: string;
  whatsappNumber?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_DIGIT_PATTERN = /\d/;

/**
 * Creates an immutable InstitutionContact.
 */
export function createInstitutionContact(input: CreateInstitutionContactInput): InstitutionContact {
  const phone = normalizePhoneLike(input.phone, "phone");
  const email = normalizeOptionalContact(input.email);
  const whatsappNumber = normalizePhoneLike(input.whatsappNumber, "whatsappNumber");

  if (email && !EMAIL_PATTERN.test(email)) {
    throw new Error("InstitutionContact.email is invalid.");
  }

  return Object.freeze({
    ...(phone ? { phone } : {}),
    ...(email ? { email } : {}),
    ...(whatsappNumber ? { whatsappNumber } : {}),
  });
}

/**
 * True when phone or email is present (publish contact gate).
 */
export function hasPublishableContact(contact: InstitutionContact): boolean {
  return Boolean(contact.phone || contact.email);
}

function normalizeOptionalContact(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizePhoneLike(value: string | undefined, field: string): string | undefined {
  const trimmed = normalizeOptionalContact(value);
  if (!trimmed) {
    return undefined;
  }
  if (!PHONE_DIGIT_PATTERN.test(trimmed)) {
    throw new Error(`InstitutionContact.${field} must include at least one digit.`);
  }
  if (trimmed.length > 40) {
    throw new Error(`InstitutionContact.${field} must be at most 40 characters.`);
  }
  return trimmed;
}
