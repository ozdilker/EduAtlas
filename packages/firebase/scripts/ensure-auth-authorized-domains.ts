/**
 * List / ensure Firebase Auth authorized domains include EduAtlas site hosts.
 * Usage: npx tsx --env-file=apps/web/.env.local packages/firebase/scripts/ensure-auth-authorized-domains.ts
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { GoogleAuth } from "google-auth-library";

const PROJECT_ID =
  process.env.FIREBASE_ADMIN_PROJECT_ID ??
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
  "eduatlas-dev";

const REQUIRED = ["eduatlas.com.tr", "www.eduatlas.com.tr", "localhost"];

async function main(): Promise<void> {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      }),
      projectId: PROJECT_ID,
    });
  }
  // Touch auth so Admin is warm.
  getAuth();

  const authClient = new GoogleAuth({
    credentials: {
      client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/cloud-platform", "https://www.googleapis.com/auth/identitytoolkit"],
  });
  const client = await authClient.getClient();
  const token = await client.getAccessToken();
  if (!token.token) throw new Error("No access token");

  const configUrl = `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config`;
  const getRes = await fetch(configUrl, {
    headers: { Authorization: `Bearer ${token.token}` },
  });
  const getBody = await getRes.json();
  if (!getRes.ok) {
    console.error(JSON.stringify(getBody, null, 2));
    throw new Error(`GET config failed: ${getRes.status}`);
  }

  const current: string[] = Array.isArray(getBody.authorizedDomains)
    ? getBody.authorizedDomains
    : [];
  console.log("current authorizedDomains:", current);

  const missing = REQUIRED.filter((d) => !current.includes(d));
  if (missing.length === 0) {
    console.log("All required domains already authorized.");
    return;
  }

  const next = [...new Set([...current, ...missing])];
  const patchRes = await fetch(`${configUrl}?updateMask=authorizedDomains`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ authorizedDomains: next }),
  });
  const patchBody = await patchRes.json();
  if (!patchRes.ok) {
    console.error(JSON.stringify(patchBody, null, 2));
    throw new Error(`PATCH config failed: ${patchRes.status}`);
  }
  console.log("updated authorizedDomains:", patchBody.authorizedDomains);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
