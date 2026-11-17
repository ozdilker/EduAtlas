/**
 * Controlled CLI: fetch Google Search Console Search Analytics (28d) and write
 * `seo_snapshots/latest` via Admin SDK.
 *
 * Prerequisites (names only — never log values):
 * - credentials/gsc-oauth.json (installed OAuth client; same as `scripts/gsc-auth.js`)
 * - credentials/gsc-token.json (from `node scripts/gsc-auth.js`)
 * - apps/web/.env.local Firebase Admin vars:
 *   FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY
 *
 * Usage:
 *   npx tsx --env-file=apps/web/.env.local packages/firebase/scripts/write-seo-gsc-snapshot.ts
 *
 * Dry-run (no Firestore write):
 *   npx tsx --env-file=apps/web/.env.local packages/firebase/scripts/write-seo-gsc-snapshot.ts --dry-run
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createSeoSnapshot, type SeoSnapshotPageRow, type SeoSnapshotQueryRow } from "@eduatlas/application";
import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import {
  createFirestoreSeoSnapshotRepository,
  getAdminFirestore,
} from "../src/server/index";

const ROOT = resolve(process.cwd());
const OAUTH_CLIENT_PATH = resolve(ROOT, "credentials/gsc-oauth.json");
const TOKEN_PATH = resolve(ROOT, "credentials/gsc-token.json");
/** Matches `scripts/gsc-auth.js` redirect used when tokens were issued. */
const GSC_OAUTH_REDIRECT = "http://localhost:3000/oauth2callback";
const SITE_URL = "sc-domain:eduatlas.com.tr";
const DRY_RUN = process.argv.includes("--dry-run");

function requireAdminEnv(): void {
  const required = [
    "FIREBASE_ADMIN_PROJECT_ID",
    "FIREBASE_ADMIN_CLIENT_EMAIL",
    "FIREBASE_ADMIN_PRIVATE_KEY",
  ] as const;
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing Firebase Admin env: ${missing.join(", ")}`);
  }
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

type GscOAuthFile = {
  installed?: { client_id?: string; client_secret?: string; redirect_uris?: string[] };
  web?: { client_id?: string; client_secret?: string; redirect_uris?: string[] };
};

/**
 * Loads OAuth2 client the same way as `scripts/gsc-auth.js`:
 * client_id/secret from credentials/gsc-oauth.json + existing token credentials.
 * Does not rewrite the token file (matches offline `scripts/gsc-report.js` usage).
 */
function loadGscAuth(): OAuth2Client {
  if (!existsSync(OAUTH_CLIENT_PATH)) {
    throw new Error(
      "Missing credentials/gsc-oauth.json. Same file used by scripts/gsc-auth.js",
    );
  }
  if (!existsSync(TOKEN_PATH)) {
    throw new Error(
      "Missing credentials/gsc-token.json. Run: node scripts/gsc-auth.js",
    );
  }

  const oauthFile = JSON.parse(readFileSync(OAUTH_CLIENT_PATH, "utf8")) as GscOAuthFile;
  const cfg = oauthFile.installed ?? oauthFile.web;
  const clientId = cfg?.client_id?.trim();
  const clientSecret = cfg?.client_secret?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("gsc-oauth.json missing installed/web client_id or client_secret");
  }

  const redirect =
    cfg.redirect_uris?.find((uri) => typeof uri === "string" && uri.trim())?.trim() ??
    GSC_OAUTH_REDIRECT;

  const tokens = JSON.parse(readFileSync(TOKEN_PATH, "utf8")) as Record<string, unknown>;
  if (!tokens.access_token && !tokens.refresh_token) {
    throw new Error("gsc-token.json has no access_token/refresh_token");
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret, redirect);
  auth.setCredentials(tokens);
  return auth;
}

async function fetchDimension(
  gsc: ReturnType<typeof google.searchconsole>,
  dimension: "page" | "query",
  startDate: string,
  endDate: string,
) {
  const response = await gsc.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: [dimension],
      rowLimit: 100,
      dataState: "final",
    },
  });
  return response.data.rows ?? [];
}

async function main(): Promise<void> {
  requireAdminEnv();
  const auth = loadGscAuth();
  const gsc = google.searchconsole({ version: "v1", auth });

  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 28);
  const startDate = formatDate(start);
  const endDate = formatDate(end);

  const [pageRows, queryRows] = await Promise.all([
    fetchDimension(gsc, "page", startDate, endDate),
    fetchDimension(gsc, "query", startDate, endDate),
  ]);

  const pages: SeoSnapshotPageRow[] = pageRows.map((row) =>
    Object.freeze({
      url: String(row.keys?.[0] ?? ""),
      clicks: Number(row.clicks ?? 0),
      impressions: Number(row.impressions ?? 0),
      ctr: Number(row.ctr ?? 0),
      position: Number(row.position ?? 0),
    }),
  );
  const queries: SeoSnapshotQueryRow[] = queryRows.map((row) =>
    Object.freeze({
      query: String(row.keys?.[0] ?? ""),
      clicks: Number(row.clicks ?? 0),
      impressions: Number(row.impressions ?? 0),
      ctr: Number(row.ctr ?? 0),
      position: Number(row.position ?? 0),
    }),
  );

  const snapshot = createSeoSnapshot({
    updatedAt: new Date().toISOString(),
    dateRange: { startDate, endDate },
    pages: pages.filter((row) => row.url),
    queries: queries.filter((row) => row.query),
  });

  console.log(
    JSON.stringify(
      {
        dryRun: DRY_RUN,
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        dateRange: snapshot.dateRange,
        summary: snapshot.summary,
        topPages: snapshot.topPages.length,
        topQueries: snapshot.topQueries.length,
        opportunities: {
          lowCtrPages: snapshot.opportunities.lowCtrPages.length,
          midPositionQueries: snapshot.opportunities.midPositionQueries.length,
        },
      },
      null,
      2,
    ),
  );

  if (DRY_RUN) {
    console.log("Dry-run: Firestore write skipped.");
    return;
  }

  const repository = createFirestoreSeoSnapshotRepository(getAdminFirestore());
  await repository.saveLatest(snapshot);
  console.log("Wrote seo_snapshots/latest");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ status: "error", message }));
  process.exit(1);
});
