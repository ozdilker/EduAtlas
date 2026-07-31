import { type AppRole, AppRole as AppRoleEnum, parseAppRole } from "./app-role";

/**
 * Authenticated subject resolved on the server from a verified session.
 * Never serialized into client-managed role state for authorization.
 */
export type CurrentUser = Readonly<{
  readonly uid: string;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly role: AppRole;
  readonly displayName?: string;
}>;

export type CreateCurrentUserInput = {
  uid: string;
  email: string;
  emailVerified: boolean;
  role: AppRole | string;
  displayName?: string;
};

export function createCurrentUser(input: CreateCurrentUserInput): CurrentUser {
  const uid = input.uid.trim();
  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName?.trim();
  const role = typeof input.role === "string" ? parseAppRole(input.role) : input.role;

  if (!uid) {
    throw new Error("CurrentUser.uid is required.");
  }
  if (!email.includes("@")) {
    throw new Error("CurrentUser.email must be a valid email.");
  }
  if (role === AppRoleEnum.Anonymous) {
    throw new Error("CurrentUser.role cannot be anonymous.");
  }

  return Object.freeze({
    uid,
    email,
    emailVerified: Boolean(input.emailVerified),
    role,
    ...(displayName ? { displayName } : {}),
  });
}
