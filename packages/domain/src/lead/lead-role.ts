/**
 * Who is submitting the information request.
 */
export enum LeadRole {
  Parent = "parent",
  Student = "student",
  Other = "other",
}

const LEAD_ROLE_VALUES: ReadonlySet<string> = new Set(Object.values(LeadRole));

/**
 * Returns true when value is a known LeadRole.
 */
export function isLeadRole(value: string): value is LeadRole {
  return LEAD_ROLE_VALUES.has(value);
}

/**
 * Parses a raw string into LeadRole or throws.
 */
export function parseLeadRole(raw: string): LeadRole {
  const value = raw.trim();

  if (!isLeadRole(value)) {
    throw new Error(`Unknown LeadRole: ${raw}`);
  }

  return value;
}
