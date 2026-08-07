export type CampaignQualityScoreInput = Readonly<{
  readonly subject: string;
  readonly preheader: string;
  readonly bodyLines: readonly string[];
  readonly hasCta: boolean;
  readonly hasTemplate: boolean;
}>;

export type CampaignQualityFactor = Readonly<{
  readonly id: string;
  readonly label: string;
  readonly points: number;
  readonly maxPoints: number;
}>;

export type CampaignQualityScore = Readonly<{
  readonly score: number;
  readonly factors: readonly CampaignQualityFactor[];
}>;

const SPAM_WORDS = Object.freeze([
  "ücretsiz!!!",
  "bedava",
  "kazanç",
  "tıkla hemen",
  "acil fırsat",
  "garantili",
  "$$$",
  "click here",
  "act now",
  "winner",
]);

const INSTITUTION_TOKEN = "{{institutionName}}";

function clampScore(value: number): number {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

function containsSpam(text: string): boolean {
  const lower = text.toLowerCase();
  return SPAM_WORDS.some((word) => lower.includes(word));
}

/**
 * Heuristic 0–100 mail quality score for Growth Center summary.
 */
export function computeCampaignQualityScore(
  input: CampaignQualityScoreInput,
): CampaignQualityScore {
  const subject = input.subject.trim();
  const preheader = input.preheader.trim();
  const bodyText = input.bodyLines.map((l) => l.trim()).filter(Boolean).join(" ");
  const combined = `${subject}\n${preheader}\n${bodyText}`;
  const hasToken =
    subject.includes(INSTITUTION_TOKEN) ||
    preheader.includes(INSTITUTION_TOKEN) ||
    bodyText.includes(INSTITUTION_TOKEN);

  const factors: CampaignQualityFactor[] = [];

  // Subject length (ideal ~30–60 chars) — max 15
  let subjectPoints = 0;
  if (subject.length >= 20 && subject.length <= 70) subjectPoints = 15;
  else if (subject.length >= 10 && subject.length <= 90) subjectPoints = 10;
  else if (subject.length > 0) subjectPoints = 5;
  factors.push({
    id: "subject_length",
    label: "Konu uzunluğu",
    points: subjectPoints,
    maxPoints: 15,
  });

  // Preheader — max 15
  let preheaderPoints = 0;
  if (preheader.length >= 40 && preheader.length <= 120) preheaderPoints = 15;
  else if (preheader.length >= 20) preheaderPoints = 10;
  else if (preheader.length > 0) preheaderPoints = 5;
  factors.push({
    id: "preheader",
    label: "Preheader",
    points: preheaderPoints,
    maxPoints: 15,
  });

  // CTA — max 15
  const ctaPoints = input.hasCta ? 15 : 0;
  factors.push({
    id: "cta",
    label: "CTA",
    points: ctaPoints,
    maxPoints: 15,
  });

  // Spam — max 15 (full if clean)
  const spamPoints = containsSpam(combined) ? 0 : 15;
  factors.push({
    id: "spam",
    label: "Spam kelimesi yok",
    points: spamPoints,
    maxPoints: 15,
  });

  // Body length — max 15
  let bodyPoints = 0;
  const bodyLen = bodyText.length;
  if (bodyLen >= 80 && bodyLen <= 800) bodyPoints = 15;
  else if (bodyLen >= 40) bodyPoints = 10;
  else if (bodyLen > 0) bodyPoints = 5;
  factors.push({
    id: "body_length",
    label: "Mail uzunluğu",
    points: bodyPoints,
    maxPoints: 15,
  });

  // Template — max 10
  const templatePoints = input.hasTemplate ? 10 : 0;
  factors.push({
    id: "template",
    label: "Şablon",
    points: templatePoints,
    maxPoints: 10,
  });

  // Personalization — max 15
  const personalizationPoints = hasToken ? 15 : 0;
  factors.push({
    id: "personalization",
    label: "Kişiselleştirme",
    points: personalizationPoints,
    maxPoints: 15,
  });

  const raw = factors.reduce((sum, f) => sum + f.points, 0);
  return Object.freeze({
    score: clampScore(raw),
    factors: Object.freeze(factors),
  });
}
