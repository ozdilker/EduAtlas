/**
 * Verifies demo Auth users: sign-in, session cookies, claim roles, owner binding.
 *
 * Usage:
 *   npx tsx --env-file=apps/web/.env.local packages/firebase/scripts/verify-demo-auth.ts
 */

import { appRoleFromClaims, canAccessAdminPortal, canAccessOwnerPortal } from "@eduatlas/domain";
import { type App, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import {
  DEMO_AUTH_USERS,
  DEMO_OWNER_INSTITUTION_ID,
  type DemoAuthUserSpec,
} from "../src/auth/demo-auth-users";
import { INSTITUTION_OWNERS_COLLECTION } from "../src/auth/firestore-owner-binding-repository";

const PROJECT_ID =
  process.env.FIREBASE_ADMIN_PROJECT_ID ??
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
  "eduatlas-dev";

function normalizePrivateKey(privateKey: string): string {
  return privateKey.replace(/\\n/g, "\n");
}

function getAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin credentials");
  }

  return initializeApp({
    credential: cert({
      projectId: PROJECT_ID,
      clientEmail,
      privateKey: normalizePrivateKey(privateKey),
    }),
    projectId: PROJECT_ID,
  });
}

type RouteAccess = {
  admin: boolean;
  owner: boolean;
  public: true;
};

function expectedRoutes(roleClaim: string): RouteAccess {
  const appRole = appRoleFromClaims({ role: roleClaim });
  return {
    admin: canAccessAdminPortal(appRole),
    owner: canAccessOwnerPortal(appRole),
    public: true,
  };
}

async function signIn(spec: DemoAuthUserSpec): Promise<{ idToken: string; localId: string }> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) throw new Error("NEXT_PUBLIC_FIREBASE_API_KEY missing");

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: spec.email,
        password: spec.password,
        returnSecureToken: true,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Sign-in failed for ${spec.email}: ${await response.text()}`);
  }

  const json = (await response.json()) as { idToken: string; localId: string };
  return { idToken: json.idToken, localId: json.localId };
}

async function main(): Promise<void> {
  const auth = getAuth(getAdminApp());
  const db = getFirestore(getAdminApp());
  let failures = 0;

  console.log(`Verifying demo auth against ${PROJECT_ID}…\n`);

  for (const user of DEMO_AUTH_USERS) {
    try {
      const { idToken, localId } = await signIn(user);
      const sessionCookie = await auth.createSessionCookie(idToken, {
        expiresIn: 60 * 60 * 1000,
      });
      const decoded = await auth.verifySessionCookie(sessionCookie, true);
      const claimRole = typeof decoded.role === "string" ? decoded.role : "";
      const routes = expectedRoutes(user.claims.role);

      if (claimRole !== user.claims.role) {
        throw new Error(`claim role mismatch: got ${claimRole}, want ${user.claims.role}`);
      }
      if (!decoded.email_verified) {
        throw new Error("emailVerified is false");
      }

      console.log(`✓ ${user.email}`);
      console.log(`  uid=${localId}`);
      console.log(`  claim.role=${claimRole}`);
      console.log(
        `  routes: /admin=${routes.admin ? "allow" : "deny"} /owner=${routes.owner ? "allow" : "deny"} public=allow`,
      );
      console.log(`  sessionCookie=${sessionCookie.slice(0, 24)}…`);
    } catch (error) {
      failures += 1;
      console.error(`✗ ${user.email}:`, error instanceof Error ? error.message : error);
    }
  }

  try {
    const owner = await auth.getUserByEmail("owner@eduatlas.dev");
    const binding = await db
      .collection(INSTITUTION_OWNERS_COLLECTION)
      .where("userId", "==", owner.uid)
      .where("status", "==", "approved")
      .limit(1)
      .get();

    if (binding.empty) {
      throw new Error("no approved institutionOwners document");
    }
    const institutionId = String(binding.docs[0]?.data().institutionId ?? "");
    if (institutionId !== DEMO_OWNER_INSTITUTION_ID) {
      throw new Error(`bound to ${institutionId}, expected ${DEMO_OWNER_INSTITUTION_ID}`);
    }
    console.log(`\n✓ owner binding: ${owner.uid} → ${institutionId}`);
  } catch (error) {
    failures += 1;
    console.error("\n✗ owner binding:", error instanceof Error ? error.message : error);
  }

  if (failures > 0) {
    throw new Error(`Demo auth verification failed (${failures} issue(s)).`);
  }
  console.log("\nAll demo auth checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
