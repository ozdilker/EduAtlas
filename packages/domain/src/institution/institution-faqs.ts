/**
 * Institution FAQ list (owner-managed Q&A).
 */

export type InstitutionFaqItem = Readonly<{
  readonly id: string;
  readonly question: string;
  readonly answer: string;
}>;

export type InstitutionFaqs = readonly InstitutionFaqItem[];

export type CreateInstitutionFaqItemInput = {
  id?: string;
  question: string;
  answer: string;
};

export const INSTITUTION_FAQ_MAX_ITEMS = 30;
export const INSTITUTION_FAQ_QUESTION_MAX_LENGTH = 300;
export const INSTITUTION_FAQ_ANSWER_MAX_LENGTH = 2000;

const FAQ_ID_PATTERN = /^[a-zA-Z0-9_-]{4,64}$/;

/**
 * Normalizes an ordered FAQ list for persistence.
 * Empty question/answer rows are dropped; order is preserved.
 */
export function createInstitutionFaqs(
  input: readonly CreateInstitutionFaqItemInput[] | undefined = [],
): InstitutionFaqs {
  const source = input ?? [];
  if (source.length > INSTITUTION_FAQ_MAX_ITEMS) {
    throw new Error(
      `Institution.faqs must have at most ${INSTITUTION_FAQ_MAX_ITEMS} items.`,
    );
  }

  const usedIds = new Set<string>();
  const items: InstitutionFaqItem[] = [];

  for (let index = 0; index < source.length; index += 1) {
    const row = source[index];
    if (!row) {
      continue;
    }

    const question = row.question.trim();
    const answer = row.answer.trim();

    if (!question && !answer) {
      continue;
    }

    if (!question) {
      throw new Error(`Institution.faqs[${index}].question is required.`);
    }
    if (!answer) {
      throw new Error(`Institution.faqs[${index}].answer is required.`);
    }
    if (question.length > INSTITUTION_FAQ_QUESTION_MAX_LENGTH) {
      throw new Error(
        `Institution.faqs[${index}].question must be at most ${INSTITUTION_FAQ_QUESTION_MAX_LENGTH} characters.`,
      );
    }
    if (answer.length > INSTITUTION_FAQ_ANSWER_MAX_LENGTH) {
      throw new Error(
        `Institution.faqs[${index}].answer must be at most ${INSTITUTION_FAQ_ANSWER_MAX_LENGTH} characters.`,
      );
    }

    const id = normalizeFaqId(row.id, index, usedIds);
    usedIds.add(id);

    items.push(
      Object.freeze({
        id,
        question,
        answer,
      }),
    );
  }

  return Object.freeze(items);
}

function normalizeFaqId(
  value: string | undefined,
  index: number,
  usedIds: ReadonlySet<string>,
): string {
  const trimmed = value?.trim() ?? "";
  if (trimmed && FAQ_ID_PATTERN.test(trimmed) && !usedIds.has(trimmed)) {
    return trimmed;
  }

  let candidate = `faq_${index + 1}`;
  let suffix = 1;
  while (usedIds.has(candidate) || (trimmed === candidate && usedIds.has(candidate))) {
    candidate = `faq_${index + 1}_${suffix}`;
    suffix += 1;
  }
  return candidate;
}
