/**
 * Campaign description → mail body paragraphs (one line per paragraph).
 * Falls back to template body lines when description is empty.
 */
export function resolveCampaignBodyLines(input: {
  description?: string | null;
  templateBodyLines: readonly string[];
}): readonly string[] {
  const fromDescription = (input.description ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (fromDescription.length > 0) {
    return Object.freeze(fromDescription);
  }
  return Object.freeze([...input.templateBodyLines]);
}
