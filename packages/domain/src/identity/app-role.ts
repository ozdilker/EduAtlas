/**
 * Application RBAC roles for Identity Foundation (Sprint-008).
 * Maps onto SECURITY-ARCHITECTURE coarse roles; resource-scoped ownership
 * is handled separately via OwnerBinding (not auto-applied on login).
 */
export enum AppRole {
  Anonymous = "anonymous",
  Parent = "parent",
  Owner = "owner",
  Admin = "admin",
}

export const APP_ROLES: readonly AppRole[] = Object.freeze([
  AppRole.Anonymous,
  AppRole.Parent,
  AppRole.Owner,
  AppRole.Admin,
]);

const ROLE_SET = new Set<string>(APP_ROLES);

export function isAppRole(value: string): value is AppRole {
  return ROLE_SET.has(value);
}

export function parseAppRole(value: string): AppRole {
  if (!isAppRole(value)) {
    throw new Error(`Unknown AppRole: ${value}`);
  }
  return value;
}

/** True when the role may access /owner/* (authenticated owner or admin). */
export function canAccessOwnerPortal(role: AppRole): boolean {
  return role === AppRole.Owner || role === AppRole.Admin;
}

/** True when the role may access /admin/*. */
export function canAccessAdminPortal(role: AppRole): boolean {
  return role === AppRole.Admin;
}

/** True when the role may access /veli/* (authenticated parent). */
export function canAccessParentPortal(role: AppRole): boolean {
  return role === AppRole.Parent;
}

/**
 * Resolves coarse AppRole from Firebase custom claims.
 * Admin SDK claims: role = admin | super_admin | moderator | owner | parent
 */
export function appRoleFromClaims(claims: Readonly<Record<string, unknown>>): AppRole {
  const raw = typeof claims.role === "string" ? claims.role.trim().toLowerCase() : "";
  if (raw === "admin" || raw === "super_admin" || raw === "moderator") {
    return AppRole.Admin;
  }
  if (raw === "owner") {
    return AppRole.Owner;
  }
  if (raw === "parent" || raw === "user") {
    return AppRole.Parent;
  }
  // Authenticated users without an elevated claim are treated as Owner candidates.
  return AppRole.Owner;
}
