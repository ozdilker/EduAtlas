import { foldTurkishText } from "@eduatlas/domain";
import type { GooglePlaceDetails } from "./google-places-provider";

/**
 * Scores how well a Place candidate matches an institution (0–1).
 * Uses folded Turkish name containment + optional address token overlap.
 * Never uses review text.
 */
export function scoreGooglePlaceMatch(input: Readonly<{
  readonly institutionName: string;
  readonly institutionAddress: string;
  readonly candidate: GooglePlaceDetails;
}>): number {
  const name = foldTurkishText(input.institutionName);
  const placeName = foldTurkishText(input.candidate.placeName);
  if (!name || !placeName) {
    return 0;
  }

  let score = 0;
  if (placeName === name) {
    score += 0.7;
  } else if (placeName.includes(name) || name.includes(placeName)) {
    score += 0.55;
  } else {
    const nameTokens = tokenize(name);
    const placeTokens = new Set(tokenize(placeName));
    const overlap = nameTokens.filter((t) => placeTokens.has(t)).length;
    if (nameTokens.length > 0) {
      score += Math.min(0.5, (overlap / nameTokens.length) * 0.5);
    }
  }

  const address = foldTurkishText(input.institutionAddress);
  const placeAddress = foldTurkishText(input.candidate.formattedAddress ?? "");
  if (address && placeAddress) {
    const addrTokens = tokenize(address).filter((t) => t.length > 2);
    const placeAddrTokens = new Set(tokenize(placeAddress));
    const addrOverlap = addrTokens.filter((t) => placeAddrTokens.has(t)).length;
    if (addrTokens.length > 0) {
      score += Math.min(0.3, (addrOverlap / addrTokens.length) * 0.3);
    }
  }

  return Math.max(0, Math.min(1, Number(score.toFixed(3))));
}

/**
 * Picks the best candidate above a minimum confidence threshold.
 */
export function pickBestGooglePlaceMatch(
  institutionName: string,
  institutionAddress: string,
  candidates: readonly GooglePlaceDetails[],
  minConfidence = 0.45,
): Readonly<{ candidate: GooglePlaceDetails; confidenceScore: number }> | null {
  let best: { candidate: GooglePlaceDetails; confidenceScore: number } | null = null;

  for (const candidate of candidates) {
    const confidenceScore = scoreGooglePlaceMatch({
      institutionName,
      institutionAddress,
      candidate,
    });
    if (confidenceScore < minConfidence) {
      continue;
    }
    if (!best || confidenceScore > best.confidenceScore) {
      best = { candidate, confidenceScore };
    }
  }

  return best;
}

function tokenize(folded: string): string[] {
  return folded
    .split(/[^a-z0-9]+/g)
    .map((t) => t.trim())
    .filter(Boolean);
}
