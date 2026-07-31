import { type InstitutionId, institutionIdAsString } from "@eduatlas/domain";

/**
 * Thrown when an institution cannot be resolved by id or slug.
 */
export class InstitutionNotFoundError extends Error {
  readonly code = "INSTITUTION_NOT_FOUND" as const;
  readonly id?: string;
  readonly slug?: string;

  constructor(lookup: { id?: InstitutionId | string; slug?: string }) {
    const id =
      typeof lookup.id === "string"
        ? lookup.id
        : lookup.id
          ? institutionIdAsString(lookup.id)
          : undefined;
    const slug = lookup.slug?.trim() || undefined;
    const detail = id ? `id=${id}` : slug ? `slug=${slug}` : "unknown";

    super(`Institution not found (${detail}).`);
    this.name = "InstitutionNotFoundError";
    this.id = id;
    this.slug = slug;
  }
}

/**
 * Thrown when creating an institution that conflicts with an existing id or slug.
 */
export class DuplicateInstitutionError extends Error {
  readonly code = "DUPLICATE_INSTITUTION" as const;
  readonly id?: string;
  readonly slug?: string;

  constructor(conflict: { id?: InstitutionId | string; slug?: string }) {
    const id =
      typeof conflict.id === "string"
        ? conflict.id
        : conflict.id
          ? institutionIdAsString(conflict.id)
          : undefined;
    const slug = conflict.slug?.trim() || undefined;
    const detail = [id ? `id=${id}` : undefined, slug ? `slug=${slug}` : undefined]
      .filter(Boolean)
      .join(", ");

    super(`Duplicate institution (${detail || "unknown"}).`);
    this.name = "DuplicateInstitutionError";
    this.id = id;
    this.slug = slug;
  }
}

export function isInstitutionNotFoundError(error: unknown): error is InstitutionNotFoundError {
  return error instanceof InstitutionNotFoundError;
}

export function isDuplicateInstitutionError(error: unknown): error is DuplicateInstitutionError {
  return error instanceof DuplicateInstitutionError;
}

/**
 * Thrown when an owner profile update fails validation or business rules.
 */
export class InstitutionProfileValidationError extends Error {
  readonly code = "INSTITUTION_PROFILE_VALIDATION" as const;

  constructor(message: string) {
    super(message);
    this.name = "InstitutionProfileValidationError";
  }
}

export function isInstitutionProfileValidationError(
  error: unknown,
): error is InstitutionProfileValidationError {
  return error instanceof InstitutionProfileValidationError;
}
