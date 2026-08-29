export type MailPersonalizationTokens = Readonly<{
  readonly institutionName: string;
}>;

/** Demo / fixture names forbidden on production preview/send personalization paths. */
const FORBIDDEN_DEMO_INSTITUTION_NAMES = Object.freeze(
  new Set(["örnek anaokulu", "örnek kurum", "ornek anaokulu", "ornek kurum"]),
);

/**
 * Ensures mail personalization uses a real institution name — never demo fixtures.
 */
export function assertPersonalizationInstitutionName(raw: string): string {
  const name = raw.trim();
  if (!name) {
    throw new Error("institutionName is required for mail personalization.");
  }
  if (FORBIDDEN_DEMO_INSTITUTION_NAMES.has(name.toLocaleLowerCase("tr-TR"))) {
    throw new Error(
      "Demo institution name is not allowed in mail personalization. Select a real recipient.",
    );
  }
  return name;
}

/**
 * Replaces v1 personalization tokens. Only `{{institutionName}}` is supported.
 * Callers must pass a real institutionName (see assertPersonalizationInstitutionName).
 */
export function applyMailTokens(text: string, tokens: MailPersonalizationTokens): string {
  const name = tokens.institutionName.trim();
  if (!name) {
    throw new Error("institutionName is required for mail personalization.");
  }
  return text.replaceAll("{{institutionName}}", name);
}
