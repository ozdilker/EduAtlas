import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Lightweight rules-source assertion (no emulator): private contact + institutions
 * must deny client read/write in firestore.rules.
 */
describe("firestore.rules contact privacy", () => {
  const rules = readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8");

  it("denies client access to institution_private_contacts", () => {
    expect(rules).toMatch(/match \/institution_private_contacts\/\{institutionId\}/);
    expect(rules).toMatch(
      /match \/institution_private_contacts\/\{institutionId\}[\s\S]*?allow read, write: if false;/,
    );
  });

  it("denies client access to institutions documents", () => {
    expect(rules).toMatch(/match \/institutions\/\{institutionId\}/);
    expect(rules).toMatch(
      /match \/institutions\/\{institutionId\}[\s\S]*?allow read, write: if false;/,
    );
  });
});
