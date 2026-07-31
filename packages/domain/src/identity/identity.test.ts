import { describe, expect, it } from "vitest";
import {
  AppRole,
  appRoleFromClaims,
  canAccessAdminPortal,
  canAccessOwnerPortal,
  canAccessParentPortal,
  createCurrentUser,
  createOwnerBinding,
  createSession,
  isApprovedOwnerBinding,
  isSessionExpired,
} from "./index";

describe("identity foundation", () => {
  it("maps Firebase claims to AppRole", () => {
    expect(appRoleFromClaims({ role: "admin" })).toBe(AppRole.Admin);
    expect(appRoleFromClaims({ role: "super_admin" })).toBe(AppRole.Admin);
    expect(appRoleFromClaims({ role: "moderator" })).toBe(AppRole.Admin);
    expect(appRoleFromClaims({ role: "owner" })).toBe(AppRole.Owner);
    expect(appRoleFromClaims({ role: "parent" })).toBe(AppRole.Parent);
    expect(appRoleFromClaims({ role: "user" })).toBe(AppRole.Parent);
    expect(appRoleFromClaims({})).toBe(AppRole.Owner);
  });

  it("enforces portal access by role", () => {
    expect(canAccessOwnerPortal(AppRole.Anonymous)).toBe(false);
    expect(canAccessOwnerPortal(AppRole.Owner)).toBe(true);
    expect(canAccessOwnerPortal(AppRole.Admin)).toBe(true);
    expect(canAccessOwnerPortal(AppRole.Parent)).toBe(false);
    expect(canAccessAdminPortal(AppRole.Owner)).toBe(false);
    expect(canAccessAdminPortal(AppRole.Admin)).toBe(true);
    expect(canAccessParentPortal(AppRole.Parent)).toBe(true);
    expect(canAccessParentPortal(AppRole.Owner)).toBe(false);
  });

  it("creates CurrentUser and Session", () => {
    const user = createCurrentUser({
      uid: "uid_1",
      email: "Owner@EduAtlas.dev",
      emailVerified: true,
      role: AppRole.Owner,
      displayName: "Owner",
    });
    expect(user.email).toBe("owner@eduatlas.dev");

    const session = createSession({
      sessionCookie: "cookie-value",
      expiresAt: "2099-01-01T00:00:00.000Z",
      user,
    });
    expect(isSessionExpired(session, "2026-07-15T00:00:00.000Z")).toBe(false);
    expect(isSessionExpired(session, "2099-01-02T00:00:00.000Z")).toBe(true);
  });

  it("rejects anonymous CurrentUser", () => {
    expect(() =>
      createCurrentUser({
        uid: "x",
        email: "a@b.co",
        emailVerified: false,
        role: AppRole.Anonymous,
      }),
    ).toThrow(/anonymous/i);
  });

  it("tracks owner binding without auto-approval", () => {
    const pending = createOwnerBinding({
      userId: "uid_1",
      institutionId: "inst_1",
      status: "pending",
      requestedAt: "2026-07-15T00:00:00.000Z",
    });
    expect(isApprovedOwnerBinding(pending)).toBe(false);

    const approved = createOwnerBinding({
      ...pending,
      status: "approved",
      approvedAt: "2026-07-16T00:00:00.000Z",
    });
    expect(isApprovedOwnerBinding(approved)).toBe(true);
  });
});
