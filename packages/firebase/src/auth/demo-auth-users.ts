/**
 * Canonical demo Auth users for eduatlas-dev.
 * Roles are expressed as Firebase custom claims (`role`), not Firestore-only.
 */

export const DEMO_OWNER_INSTITUTION_ID = "seed_inst_ist_kolej_1";

export type DemoAuthUserSpec = Readonly<{
  email: string;
  password: string;
  emailVerified: boolean;
  displayName: string;
  /** Firebase custom claims — source of truth for coarse AppRole. */
  claims: Readonly<{ role: string }>;
  purpose: string;
}>;

export const DEMO_AUTH_USERS: readonly DemoAuthUserSpec[] = Object.freeze([
  {
    email: "admin@eduatlas.dev",
    password: "admin-pass-10",
    emailVerified: true,
    displayName: "Demo Admin",
    claims: Object.freeze({ role: "admin" }),
    purpose: "Admin portal",
  },
  {
    email: "owner@eduatlas.dev",
    password: "owner-pass-10",
    emailVerified: true,
    displayName: "Demo Owner",
    claims: Object.freeze({ role: "owner" }),
    purpose: `Owner portal bound to ${DEMO_OWNER_INSTITUTION_ID}`,
  },
  {
    email: "editor@eduatlas.dev",
    password: "editor-pass-10",
    emailVerified: true,
    displayName: "Demo Editor",
    claims: Object.freeze({ role: "admin" }),
    purpose: "Review Queue testing (Admin claim)",
  },
  {
    email: "demo@eduatlas.dev",
    password: "demo-pass-10",
    emailVerified: true,
    displayName: "Demo Parent",
    claims: Object.freeze({ role: "parent" }),
    purpose: "Parent / public flows",
  },
]);
