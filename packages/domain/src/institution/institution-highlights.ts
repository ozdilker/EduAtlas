/**
 * Institution highlight list (owner-managed title + description cards).
 */

export type InstitutionHighlightItem = Readonly<{
  readonly id: string;
  readonly title: string;
  readonly description: string;
}>;

export type InstitutionHighlights = readonly InstitutionHighlightItem[];

export type CreateInstitutionHighlightItemInput = {
  id?: string;
  title: string;
  description: string;
};

export const INSTITUTION_HIGHLIGHT_MAX_ITEMS = 12;
export const INSTITUTION_HIGHLIGHT_TITLE_MAX_LENGTH = 120;
export const INSTITUTION_HIGHLIGHT_DESCRIPTION_MAX_LENGTH = 500;

const HIGHLIGHT_ID_PATTERN = /^[a-zA-Z0-9_-]{4,64}$/;

/**
 * Normalizes an ordered highlight list for persistence.
 * Empty title/description rows are dropped; order is preserved.
 */
export function createInstitutionHighlights(
  input: readonly CreateInstitutionHighlightItemInput[] | undefined = [],
): InstitutionHighlights {
  const source = input ?? [];
  if (source.length > INSTITUTION_HIGHLIGHT_MAX_ITEMS) {
    throw new Error(
      `Institution.highlights must have at most ${INSTITUTION_HIGHLIGHT_MAX_ITEMS} items.`,
    );
  }

  const usedIds = new Set<string>();
  const items: InstitutionHighlightItem[] = [];

  for (let index = 0; index < source.length; index += 1) {
    const row = source[index];
    if (!row) {
      continue;
    }

    const title = row.title.trim();
    const description = row.description.trim();

    if (!title && !description) {
      continue;
    }

    if (!title) {
      throw new Error(`Institution.highlights[${index}].title is required.`);
    }
    if (!description) {
      throw new Error(`Institution.highlights[${index}].description is required.`);
    }
    if (title.length > INSTITUTION_HIGHLIGHT_TITLE_MAX_LENGTH) {
      throw new Error(
        `Institution.highlights[${index}].title must be at most ${INSTITUTION_HIGHLIGHT_TITLE_MAX_LENGTH} characters.`,
      );
    }
    if (description.length > INSTITUTION_HIGHLIGHT_DESCRIPTION_MAX_LENGTH) {
      throw new Error(
        `Institution.highlights[${index}].description must be at most ${INSTITUTION_HIGHLIGHT_DESCRIPTION_MAX_LENGTH} characters.`,
      );
    }

    const id = normalizeHighlightId(row.id, index, usedIds);
    usedIds.add(id);

    items.push(
      Object.freeze({
        id,
        title,
        description,
      }),
    );
  }

  return Object.freeze(items);
}

function normalizeHighlightId(
  value: string | undefined,
  index: number,
  usedIds: ReadonlySet<string>,
): string {
  const trimmed = value?.trim() ?? "";
  if (trimmed && HIGHLIGHT_ID_PATTERN.test(trimmed) && !usedIds.has(trimmed)) {
    return trimmed;
  }

  let candidate = `highlight_${index + 1}`;
  let suffix = 1;
  while (usedIds.has(candidate)) {
    candidate = `highlight_${index + 1}_${suffix}`;
    suffix += 1;
  }
  return candidate;
}
