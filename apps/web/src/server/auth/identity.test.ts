import { signInWithEmailPassword } from "@eduatlas/application";
import { AppRole } from "@eduatlas/domain";
import { afterEach, describe, expect, it } from "vitest";
import { OWNER_DEMO_INSTITUTION_ID } from "../owner/owner-demo-context";
import {
  DEV_AUTH_SEED_USERS,
  getAuthenticationService,
  resetAuthenticationServiceForTests,
} from "./authentication-service";
import {
  resetOwnerBindingRepositoryForTests,
  resolveAuthenticatedOwnerInstitutionId,
} from "./owner-binding";

describe("web identity composition", () => {
  afterEach(() => {
    resetAuthenticationServiceForTests();
    resetOwnerBindingRepositoryForTests();
    delete process.env.EDUATLAS_OWNER_DEMO_FALLBACK;
  });

  it("uses in-memory auth with seeded owner and admin in development", async () => {
    process.env.EDUATLAS_AUTH_MEMORY_FALLBACK = "true";
    resetAuthenticationServiceForTests();

    const authenticationService = getAuthenticationService();
    const ownerSeed = DEV_AUTH_SEED_USERS[0];
    const result = await signInWithEmailPassword(
      { email: ownerSeed.email, password: ownerSeed.password },
      { authenticationService },
    );

    expect(result.session.user.role).toBe(AppRole.Owner);
    expect(result.session.user.emailVerified).toBe(true);
  });

  it("keeps demo institution isolated behind fallback flag", async () => {
    process.env.EDUATLAS_OWNER_DEMO_FALLBACK = "false";
    const unbound = await resolveAuthenticatedOwnerInstitutionId("dev_owner_uid");
    expect(unbound).toBeNull();

    process.env.EDUATLAS_OWNER_DEMO_FALLBACK = "true";
    const demo = await resolveAuthenticatedOwnerInstitutionId("dev_owner_uid");
    expect(demo).toBe(OWNER_DEMO_INSTITUTION_ID);
  });
});
