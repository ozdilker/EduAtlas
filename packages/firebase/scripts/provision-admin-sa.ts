/**
 * Creates a Firestore Admin service account key for local Next.js SSR.
 * Uses the Firebase CLI OAuth token. Writes credentials to apps/web/.env.local.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PROJECT_ID = "eduatlas-dev";
const ACCOUNT_ID = "eduatlas-web-admin";
const EMAIL = `${ACCOUNT_ID}@${PROJECT_ID}.iam.gserviceaccount.com`;

function readFirebaseCliAccessToken(): string {
  const configPath = path.join(os.homedir(), ".config", "configstore", "firebase-tools.json");
  const raw = fs.readFileSync(configPath, "utf8");
  const match = raw.match(/"access_token"\s*:\s*"([^"]+)"/);
  if (!match?.[1]) {
    throw new Error("Firebase CLI access_token not found.");
  }
  return match[1];
}

async function api(token: string, method: string, url: string, body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(`${method} ${url} => ${response.status} ${text}`);
  }
  return json;
}

type IamBinding = { role: string; members: string[] };
type IamPolicy = { bindings?: IamBinding[]; etag?: string; version?: number };

async function main(): Promise<void> {
  const token = readFirebaseCliAccessToken();

  try {
    await api(
      token,
      "POST",
      `https://iam.googleapis.com/v1/projects/${PROJECT_ID}/serviceAccounts`,
      {
        accountId: ACCOUNT_ID,
        serviceAccount: {
          displayName: "EduAtlas Web Admin",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("409") && !message.includes("alreadyExists")) {
      throw error;
    }
  }

  const policy = (await api(
    token,
    "POST",
    `https://cloudresourcemanager.googleapis.com/v1/projects/${PROJECT_ID}:getIamPolicy`,
    {},
  )) as IamPolicy;

  const bindingRole = "roles/datastore.user";
  const member = `serviceAccount:${EMAIL}`;
  const bindings = Array.isArray(policy.bindings) ? [...policy.bindings] : [];
  const existing = bindings.find((item) => item.role === bindingRole);
  if (existing) {
    if (!existing.members.includes(member)) {
      existing.members = [...existing.members, member];
    }
  } else {
    bindings.push({ role: bindingRole, members: [member] });
  }

  await api(
    token,
    "POST",
    `https://cloudresourcemanager.googleapis.com/v1/projects/${PROJECT_ID}:setIamPolicy`,
    { policy: { ...policy, bindings } },
  );

  const key = await api(
    token,
    "POST",
    `https://iam.googleapis.com/v1/projects/${PROJECT_ID}/serviceAccounts/${encodeURIComponent(EMAIL)}/keys`,
    { privateKeyType: "TYPE_GOOGLE_CREDENTIALS_FILE", keyAlgorithm: "KEY_ALG_RSA_2048" },
  );

  const decoded = Buffer.from(key.privateKeyData as string, "base64").toString("utf8");
  const parsed = JSON.parse(decoded) as {
    client_email: string;
    private_key: string;
  };

  const envPath = path.resolve("apps/web/.env.local");
  let env = fs.readFileSync(envPath, "utf8");
  env = env
    .split("\n")
    .filter((line) => !line.startsWith("FIREBASE_ADMIN_CLIENT_EMAIL="))
    .filter((line) => !line.startsWith("FIREBASE_ADMIN_PRIVATE_KEY="))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();

  const privateKeyEscaped = parsed.private_key.replaceAll("\n", "\\n");
  env += `\nFIREBASE_ADMIN_CLIENT_EMAIL=${parsed.client_email}\nFIREBASE_ADMIN_PRIVATE_KEY="${privateKeyEscaped}"\n`;
  fs.writeFileSync(envPath, `${env}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        serviceAccount: EMAIL,
        role: bindingRole,
        envUpdated: envPath,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
