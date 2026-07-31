import { AppRole, createOwnerBinding } from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import {
  requestPasswordReset,
  signInWithEmailPassword,
  signUpWithEmailPassword,
  verifySession,
} from "./auth-use-cases";
import { InvalidCredentialsError, WeakPasswordError } from "./errors";
import { createInMemoryAuthenticationService } from "./in-memory-authentication-service";
import { createInMemoryOwnerBindingRepository } from "./in-memory-owner-binding-repository";
import { resolveOwnerInstitutionId } from "./resolve-owner-institution";

describe("AuthenticationService (in-memory)", () => {
  it("signs in, creates session, and verifies cookie", async () => {
    const authenticationService = createInMemoryAuthenticationService({
      seedUsers: [
        {
          email: "owner@eduatlas.dev",
          password: "secure-pass-1",
          role: AppRole.Owner,
        },
      ],
    });

    const result = await signInWithEmailPassword(
      { email: "Owner@EduAtlas.dev", password: "secure-pass-1" },
      { authenticationService },
    );

    expect(result.signIn.user.role).toBe(AppRole.Owner);
    expect(result.session.sessionCookie).toBeTruthy();

    const verified = await verifySession(result.session.sessionCookie, {
      authenticationService,
    });
    expect(verified.user.email).toBe("owner@eduatlas.dev");
  });

  it("rejects invalid credentials", async () => {
    const authenticationService = createInMemoryAuthenticationService({
      seedUsers: [{ email: "owner@eduatlas.dev", password: "secure-pass-1" }],
    });

    await expect(
      signInWithEmailPassword(
        { email: "owner@eduatlas.dev", password: "wrong-password" },
        { authenticationService },
      ),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it("enforces password policy on sign-up", async () => {
    const authenticationService = createInMemoryAuthenticationService();

    await expect(
      signUpWithEmailPassword(
        { email: "new@eduatlas.dev", password: "short" },
        { authenticationService },
      ),
    ).rejects.toBeInstanceOf(WeakPasswordError);
  });

  it("records password reset without revealing whether email exists", async () => {
    const authenticationService = createInMemoryAuthenticationService();
    await requestPasswordReset({ email: "missing@eduatlas.dev" }, { authenticationService });
    expect(authenticationService.passwordResetRequests).toContain("missing@eduatlas.dev");
  });
});

describe("resolveOwnerInstitutionId", () => {
  it("does not auto-bind and keeps demo seed isolated", async () => {
    const ownerBindingRepository = createInMemoryOwnerBindingRepository();

    const unbound = await resolveOwnerInstitutionId(
      { userId: "uid_1" },
      { ownerBindingRepository, demoInstitutionId: "seed_inst_ist_kolej_1" },
    );
    expect(unbound).toEqual({ institutionId: null, source: "unbound" });

    const demo = await resolveOwnerInstitutionId(
      { userId: "uid_1" },
      {
        ownerBindingRepository,
        demoInstitutionId: "seed_inst_ist_kolej_1",
        allowDemoInstitutionFallback: true,
      },
    );
    expect(demo).toEqual({
      institutionId: "seed_inst_ist_kolej_1",
      source: "demo",
    });
  });

  it("prefers approved binding over demo fallback", async () => {
    const ownerBindingRepository = createInMemoryOwnerBindingRepository([
      createOwnerBinding({
        userId: "uid_1",
        institutionId: "inst_bound",
        status: "approved",
        requestedAt: "2026-07-15T00:00:00.000Z",
        approvedAt: "2026-07-15T01:00:00.000Z",
      }),
    ]);

    const result = await resolveOwnerInstitutionId(
      { userId: "uid_1" },
      {
        ownerBindingRepository,
        demoInstitutionId: "seed_inst_ist_kolej_1",
        allowDemoInstitutionFallback: true,
      },
    );
    expect(result).toEqual({ institutionId: "inst_bound", source: "binding" });
  });
});
