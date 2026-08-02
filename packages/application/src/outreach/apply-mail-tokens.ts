export type MailPersonalizationTokens = Readonly<{
  readonly institutionName: string;
}>;

/**
 * Replaces v1 personalization tokens. Only `{{institutionName}}` is supported.
 */
export function applyMailTokens(text: string, tokens: MailPersonalizationTokens): string {
  const name = tokens.institutionName.trim() || "Kurumunuz";
  return text.replaceAll("{{institutionName}}", name);
}
