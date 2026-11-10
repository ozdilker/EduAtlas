import { foldTurkishText } from "@eduatlas/domain";
import { phonesMatch } from "../lib/phones-match";
import type { GooglePlaceDetails } from "./google-places-provider";

/** Minimum confidence required for automatic Google Place matching. */
export const GOOGLE_PLACE_MATCH_MIN_CONFIDENCE = 0.55;

/** Minimum score gap between best and second-best candidates. */
export const GOOGLE_PLACE_MATCH_MIN_MARGIN = 0.12;

/** Primary phone match boost — supportive only; cannot alone clear the confidence floor. */
export const GOOGLE_PLACE_PHONE_MATCH_BOOST = 0.08;

/** WhatsApp-only match boost (no primary phone on institution). */
export const GOOGLE_PLACE_WHATSAPP_MATCH_BOOST = 0.04;

/** Primary phone mismatch penalty — controlled, never a hard reject by itself. */
export const GOOGLE_PLACE_PHONE_MISMATCH_PENALTY = -0.08;

/**
 * Generic name tokens that dilute brand matching. Grade/level tokens are intentionally
 * excluded so anaokulu vs lise distinctions stay in the score.
 */
const GENERIC_NAME_TOKENS: ReadonlySet<string> = new Set([
  "ozel",
  "kurumu",
  "kurum",
  "egitim",
  "egitimi",
  "ogretim",
  "okul",
  "okulu",
  "okullari",
  "kolej",
  "koleji",
  "merkez",
  "merkezi",
  "ve",
  "the",
]);

const GRADE_BUCKETS: ReadonlyArray<Readonly<{ bucket: string; tokens: ReadonlySet<string> }>> = [
  {
    bucket: "preschool",
    tokens: new Set(["anaokulu", "anaokul", "anasinifi", "anasinif", "kres"]),
  },
  {
    bucket: "primary",
    tokens: new Set(["ilkokul", "ilkokulu"]),
  },
  {
    bucket: "middle",
    tokens: new Set(["ortaokul", "ortaokulu"]),
  },
  {
    bucket: "high",
    tokens: new Set(["lise", "lisesi"]),
  },
];

/** Folded Türkiye il adları — başka ilin açıkça geçmesi şehir çelişkisi sayılır. */
const TURKISH_CITY_NAMES_FOLDED: ReadonlySet<string> = new Set([
  "adana",
  "adiyaman",
  "afyonkarahisar",
  "agri",
  "aksaray",
  "amasya",
  "ankara",
  "antalya",
  "ardahan",
  "artvin",
  "aydin",
  "balikesir",
  "bartin",
  "batman",
  "bayburt",
  "bilecik",
  "bingol",
  "bitlis",
  "bolu",
  "burdur",
  "bursa",
  "canakkale",
  "cankiri",
  "corum",
  "denizli",
  "diyarbakir",
  "duzce",
  "edirne",
  "elazig",
  "erzincan",
  "erzurum",
  "eskisehir",
  "gaziantep",
  "giresun",
  "gumushane",
  "hakkari",
  "hatay",
  "igdir",
  "isparta",
  "istanbul",
  "izmir",
  "kahramanmaras",
  "karabuk",
  "karaman",
  "kars",
  "kastamonu",
  "kayseri",
  "kilis",
  "kirikkale",
  "kirklareli",
  "kirsehir",
  "kocaeli",
  "konya",
  "kutahya",
  "malatya",
  "manisa",
  "mardin",
  "mersin",
  "mugla",
  "mus",
  "nevsehir",
  "nigde",
  "ordu",
  "osmaniye",
  "rize",
  "sakarya",
  "samsun",
  "sanliurfa",
  "siirt",
  "sinop",
  "sirnak",
  "sivas",
  "tekirdag",
  "tokat",
  "trabzon",
  "tunceli",
  "usak",
  "van",
  "yalova",
  "yozgat",
  "zonguldak",
]);

const ADDRESS_NOISE_TOKENS: ReadonlySet<string> = new Set([
  "mah",
  "mahallesi",
  "cad",
  "caddesi",
  "sk",
  "sok",
  "sokak",
  "no",
  "bulvar",
  "bulv",
  "apt",
  "apartmani",
  "sitesi",
  "blok",
  "kat",
  "ic",
  "kapi",
]);

export type ScoreGooglePlaceMatchInput = Readonly<{
  readonly institutionName: string;
  readonly institutionAddress: string;
  readonly candidate: GooglePlaceDetails;
  readonly cityName?: string;
  readonly districtName?: string;
  /** Institution primary contact phone. */
  readonly contactPhone?: string;
  /** Institution WhatsApp — secondary signal only. */
  readonly whatsappNumber?: string;
}>;

export type PickGooglePlaceMatchOptions = Readonly<{
  readonly cityName?: string;
  readonly districtName?: string;
  readonly contactPhone?: string;
  readonly whatsappNumber?: string;
  readonly minConfidence?: number;
  readonly minMargin?: number;
}>;

/**
 * Scores how well a Place candidate matches an institution (0–1).
 * Uses folded Turkish name comparison + optional address token overlap.
 * Never uses review text.
 */
export function scoreGooglePlaceMatch(input: ScoreGooglePlaceMatchInput): number {
  const name = foldTurkishText(input.institutionName);
  const placeName = foldTurkishText(input.candidate.placeName);
  if (!name || !placeName) {
    return 0;
  }

  const nameTokens = tokenize(name);
  const placeTokens = tokenize(placeName);
  if (hasConflictingGrade(nameTokens, placeTokens)) {
    return 0;
  }

  if (
    hasClearGeoConflict({
      cityName: input.cityName,
      districtName: input.districtName,
      candidateAddress: input.candidate.formattedAddress,
    })
  ) {
    return 0;
  }

  let score = 0;
  if (placeName === name) {
    score += 0.7;
  } else if (placeName.includes(name) || name.includes(placeName)) {
    score += 0.55;
  } else {
    const coreName = joinTokens(stripGenericTokens(nameTokens));
    const corePlace = joinTokens(stripGenericTokens(placeTokens));
    if (coreName && corePlace && (corePlace.includes(coreName) || coreName.includes(corePlace))) {
      score += 0.55;
    } else {
      const distinctiveName = distinctiveTokens(nameTokens);
      const placeSet = new Set(placeTokens);
      const overlap = distinctiveName.filter((t) => placeSet.has(t)).length;
      if (distinctiveName.length > 0) {
        score += Math.min(0.5, (overlap / distinctiveName.length) * 0.5);
      }
    }
  }

  const address = foldTurkishText(input.institutionAddress);
  const placeAddress = foldTurkishText(input.candidate.formattedAddress ?? "");
  const institutionAddrTokens = address
    ? tokenize(address).filter((t) => t.length > 2)
    : [];
  const hasInstitutionAddress = institutionAddrTokens.length > 0;
  const hasCandidateAddress = Boolean(placeAddress);

  if (hasInstitutionAddress && hasCandidateAddress) {
    const placeAddrTokens = new Set(tokenize(placeAddress));
    const addrOverlap = institutionAddrTokens.filter((t) => placeAddrTokens.has(t)).length;
    if (institutionAddrTokens.length > 0) {
      score += Math.min(0.3, (addrOverlap / institutionAddrTokens.length) * 0.3);
    }
    // Name similarity alone must not auto-match when both sides have addresses.
    if (addrOverlap === 0) {
      score = Math.min(score, GOOGLE_PLACE_MATCH_MIN_CONFIDENCE - 0.01);
    }
  }

  const scoreBeforePhone = score;
  score += resolvePhoneScoreDelta({
    contactPhone: input.contactPhone,
    whatsappNumber: input.whatsappNumber,
    candidate: input.candidate,
  });

  // Phone must not be the sole reason a weak name/address score clears the auto-match floor.
  if (scoreBeforePhone < GOOGLE_PLACE_MATCH_MIN_CONFIDENCE && score > scoreBeforePhone) {
    score = Math.min(score, GOOGLE_PLACE_MATCH_MIN_CONFIDENCE - 0.01);
  }

  return Math.max(0, Math.min(1, Number(score.toFixed(3))));
}

/**
 * Picks the best safe candidate: min confidence, clear geo/grade, and margin vs #2.
 */
export function pickBestGooglePlaceMatch(
  institutionName: string,
  institutionAddress: string,
  candidates: readonly GooglePlaceDetails[],
  options?: PickGooglePlaceMatchOptions | number,
): Readonly<{ candidate: GooglePlaceDetails; confidenceScore: number }> | null {
  const resolved = resolvePickOptions(options);
  const scored = candidates
    .map((candidate) =>
      Object.freeze({
        candidate,
        confidenceScore: scoreGooglePlaceMatch({
          institutionName,
          institutionAddress,
          candidate,
          cityName: resolved.cityName,
          districtName: resolved.districtName,
          contactPhone: resolved.contactPhone,
          whatsappNumber: resolved.whatsappNumber,
        }),
      }),
    )
    .sort((a, b) => b.confidenceScore - a.confidenceScore);

  const best = scored[0];
  if (!best || best.confidenceScore < resolved.minConfidence) {
    return null;
  }

  const second = scored[1];
  if (
    second &&
    second.confidenceScore >= resolved.minConfidence &&
    best.confidenceScore - second.confidenceScore < resolved.minMargin
  ) {
    return null;
  }

  return best;
}

function resolvePickOptions(
  options: PickGooglePlaceMatchOptions | number | undefined,
): Readonly<{
  cityName?: string;
  districtName?: string;
  contactPhone?: string;
  whatsappNumber?: string;
  minConfidence: number;
  minMargin: number;
}> {
  if (typeof options === "number") {
    return {
      minConfidence: options,
      minMargin: GOOGLE_PLACE_MATCH_MIN_MARGIN,
    };
  }
  return {
    cityName: options?.cityName,
    districtName: options?.districtName,
    contactPhone: options?.contactPhone,
    whatsappNumber: options?.whatsappNumber,
    minConfidence: options?.minConfidence ?? GOOGLE_PLACE_MATCH_MIN_CONFIDENCE,
    minMargin: options?.minMargin ?? GOOGLE_PLACE_MATCH_MIN_MARGIN,
  };
}

function hasComparablePhone(value: string | undefined): boolean {
  return Boolean(value && /\d/.test(value));
}

function candidatePhone(candidate: GooglePlaceDetails): string | undefined {
  const national = candidate.nationalPhoneNumber?.trim();
  if (hasComparablePhone(national)) {
    return national;
  }
  const international = candidate.internationalPhoneNumber?.trim();
  return hasComparablePhone(international) ? international : undefined;
}

/**
 * Soft phone signal. Missing either side → 0 (neutral). Never hard-rejects.
 */
export function resolvePhoneScoreDelta(input: Readonly<{
  readonly contactPhone?: string;
  readonly whatsappNumber?: string;
  readonly candidate: GooglePlaceDetails;
}>): number {
  const googlePhone = candidatePhone(input.candidate);
  if (!googlePhone) {
    return 0;
  }

  const primary = input.contactPhone?.trim();
  if (hasComparablePhone(primary)) {
    return phonesMatch(primary, googlePhone)
      ? GOOGLE_PLACE_PHONE_MATCH_BOOST
      : GOOGLE_PLACE_PHONE_MISMATCH_PENALTY;
  }

  const whatsapp = input.whatsappNumber?.trim();
  if (hasComparablePhone(whatsapp) && phonesMatch(whatsapp, googlePhone)) {
    return GOOGLE_PLACE_WHATSAPP_MATCH_BOOST;
  }

  // WhatsApp-only mismatch or no institution phone → neutral (no hard penalty).
  return 0;
}

/**
 * Clear city/district mismatch only.
 * Missing labels are never treated as conflict — only positively detected alternatives are.
 */
export function hasClearGeoConflict(input: Readonly<{
  readonly cityName?: string;
  readonly districtName?: string;
  readonly candidateAddress?: string;
}>): boolean {
  const address = input.candidateAddress?.trim();
  if (!address) {
    return false;
  }

  const foldedAddress = foldTurkishText(address);
  if (!foldedAddress) {
    return false;
  }

  const city = input.cityName?.trim();
  const district = input.districtName?.trim();
  if (!city && !district) {
    return false;
  }

  const foldedCity = city ? foldTurkishText(city) : "";
  const foldedDistrict = district ? foldTurkishText(district) : "";
  const addressTokens = new Set(tokenize(foldedAddress));

  const cityHit = Boolean(foldedCity && foldedAddress.includes(foldedCity));
  const districtHit = Boolean(foldedDistrict && foldedAddress.includes(foldedDistrict));

  // Expected district present → no geo conflict from district side.
  if (districtHit) {
    // Still block if a different known city is also clearly present without expected city.
    if (foldedCity && !cityHit && findOtherKnownCityToken(addressTokens, foldedCity)) {
      return true;
    }
    return false;
  }

  // Clear city conflict: expected city absent, another known city present.
  if (foldedCity && !cityHit && findOtherKnownCityToken(addressTokens, foldedCity)) {
    return true;
  }

  // Clear district conflict: expected city present, a different district label sits
  // immediately before that city (e.g. "Beşiktaş/İstanbul") and is not the expected district.
  if (foldedCity && cityHit && foldedDistrict) {
    const hintedDistrict = districtHintBeforeCity(foldedAddress, foldedCity);
    if (hintedDistrict && hintedDistrict !== foldedDistrict) {
      return true;
    }
  }

  // Missing city and/or district labels → not a conflict.
  return false;
}

function findOtherKnownCityToken(
  addressTokens: ReadonlySet<string>,
  expectedCityFolded: string,
): string | null {
  for (const token of addressTokens) {
    if (token === expectedCityFolded) {
      continue;
    }
    if (TURKISH_CITY_NAMES_FOLDED.has(token)) {
      return token;
    }
  }
  return null;
}

/**
 * Extracts the location token immediately before the city in folded addresses
 * such as "levent mah besiktas/istanbul".
 */
function districtHintBeforeCity(foldedAddress: string, foldedCity: string): string | null {
  const cityIndex = foldedAddress.lastIndexOf(foldedCity);
  if (cityIndex <= 0) {
    return null;
  }
  const before = foldedAddress.slice(0, cityIndex);
  const tokens = tokenize(before).filter(
    (token) =>
      token.length > 2 &&
      !ADDRESS_NOISE_TOKENS.has(token) &&
      !/^\d+$/.test(token) &&
      !TURKISH_CITY_NAMES_FOLDED.has(token),
  );
  if (tokens.length === 0) {
    return null;
  }
  return tokens[tokens.length - 1] ?? null;
}

function tokenize(folded: string): string[] {
  return folded
    .split(/[^a-z0-9]+/g)
    .map((t) => t.trim())
    .filter(Boolean);
}

function stripGenericTokens(tokens: readonly string[]): string[] {
  return tokens.filter((t) => !GENERIC_NAME_TOKENS.has(t));
}

function distinctiveTokens(tokens: readonly string[]): string[] {
  return stripGenericTokens(tokens);
}

function joinTokens(tokens: readonly string[]): string {
  return tokens.join(" ").trim();
}

function gradeBucket(tokens: readonly string[]): string | null {
  for (const { bucket, tokens: gradeTokens } of GRADE_BUCKETS) {
    if (tokens.some((t) => gradeTokens.has(t))) {
      return bucket;
    }
  }
  return null;
}

function hasConflictingGrade(
  institutionTokens: readonly string[],
  placeTokens: readonly string[],
): boolean {
  const left = gradeBucket(institutionTokens);
  const right = gradeBucket(placeTokens);
  return Boolean(left && right && left !== right);
}
