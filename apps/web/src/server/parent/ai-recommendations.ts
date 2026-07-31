import {
  InstitutionType,
  InstitutionVerification,
  isInstitutionType,
} from "@eduatlas/domain";
import type { InstitutionCardViewData } from "@eduatlas/ui";
import { searchPublicInstitutions } from "../institutions/search-public-institutions";
import { getInstitutionTypeLabel } from "../institutions/to-profile-view";

export const MIN_FAVORITES_FOR_AI = 5;

export type ParentFavoriteInput = {
  id: string;
  name: string;
  typeLabel: string;
  city?: string;
  district?: string;
  badges?: {
    verified?: boolean;
    premium?: boolean;
    featured?: boolean;
  };
};

export type AiRecommendationSearchContext = {
  query?: string;
  cityId?: string;
  districtId?: string;
  type?: string;
  verified?: boolean;
  premium?: boolean;
  cityLabel?: string;
  districtLabel?: string;
  typeLabel?: string;
};

export type ParentPreferenceProfile = {
  preferredTypes: string[];
  preferredCities: string[];
  preferredDistricts: string[];
  prefersVerified: boolean;
  prefersPremium: boolean;
  summary: string;
};

export type AiRecommendationsResult = {
  profile: ParentPreferenceProfile;
  institutions: InstitutionCardViewData[];
  model: string;
  usedLlm: boolean;
};

function topKeys(counts: Map<string, number>, limit: number): string[] {
  return [...counts.entries()]
    .filter(([key]) => key.trim().length > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "tr"))
    .slice(0, limit)
    .map(([key]) => key);
}

/**
 * Infers a parent preference profile from favorited institutions.
 */
export function buildParentPreferenceProfile(
  favorites: readonly ParentFavoriteInput[],
): ParentPreferenceProfile {
  const types = new Map<string, number>();
  const cities = new Map<string, number>();
  const districts = new Map<string, number>();
  let verified = 0;
  let premium = 0;

  for (const item of favorites) {
    types.set(item.typeLabel, (types.get(item.typeLabel) ?? 0) + 1);
    if (item.city) cities.set(item.city, (cities.get(item.city) ?? 0) + 1);
    if (item.district) districts.set(item.district, (districts.get(item.district) ?? 0) + 1);
    if (item.badges?.verified) verified += 1;
    if (item.badges?.premium) premium += 1;
  }

  const preferredTypes = topKeys(types, 3);
  const preferredCities = topKeys(cities, 3);
  const preferredDistricts = topKeys(districts, 3);
  const prefersVerified = verified / Math.max(favorites.length, 1) >= 0.4;
  const prefersPremium = premium / Math.max(favorites.length, 1) >= 0.3;

  const typePart = preferredTypes[0] ?? "eğitim kurumu";
  const cityPart = preferredCities[0] ? `${preferredCities[0]} odaklı` : "çok şehirli";
  const trustPart = prefersVerified ? "doğrulanmış kurumları tercih eden" : "çeşitli seçeneklere açık";
  const summary = `${cityPart}, ${typePart.toLocaleLowerCase("tr-TR")} arayan ve ${trustPart} bir veli profili.`;

  return {
    preferredTypes,
    preferredCities,
    preferredDistricts,
    prefersVerified,
    prefersPremium,
    summary,
  };
}

function resolveSearchTypeLabel(search?: AiRecommendationSearchContext): string | undefined {
  if (search?.typeLabel?.trim()) {
    return search.typeLabel.trim();
  }
  const type = search?.type?.trim();
  if (type && isInstitutionType(type)) {
    return getInstitutionTypeLabel(type as InstitutionType);
  }
  return undefined;
}

function describeSearchContext(search?: AiRecommendationSearchContext): string {
  if (!search) {
    return "Genel keşif (aktif arama filtresi yok).";
  }
  const parts: string[] = [];
  if (search.query?.trim()) {
    parts.push(`anahtar kelime: "${search.query.trim()}"`);
  }
  if (search.cityLabel?.trim() || search.cityId?.trim()) {
    parts.push(`şehir: ${search.cityLabel?.trim() || search.cityId}`);
  }
  if (search.districtLabel?.trim() || search.districtId?.trim()) {
    parts.push(`ilçe: ${search.districtLabel?.trim() || search.districtId}`);
  }
  const typeLabel = resolveSearchTypeLabel(search);
  if (typeLabel) {
    parts.push(`tür: ${typeLabel}`);
  }
  if (search.verified) {
    parts.push("yalnızca doğrulanmış");
  }
  if (search.premium) {
    parts.push("premium tercih");
  }
  return parts.length > 0 ? parts.join(", ") : "Genel keşif (aktif arama filtresi yok).";
}

function scoreCandidate(
  candidate: InstitutionCardViewData,
  profile: ParentPreferenceProfile,
  search?: AiRecommendationSearchContext,
): number {
  let score = 0;
  if (candidate.typeLabel && profile.preferredTypes.includes(candidate.typeLabel)) {
    score += 45;
  }
  if (candidate.city && profile.preferredCities.includes(candidate.city)) {
    score += 30;
  }
  if (candidate.district && profile.preferredDistricts.includes(candidate.district)) {
    score += 18;
  }
  if (profile.prefersVerified && candidate.badges?.verified) {
    score += 12;
  }
  if (profile.prefersPremium && candidate.badges?.premium) {
    score += 8;
  }
  if (candidate.badges?.featured) {
    score += 4;
  }

  const searchTypeLabel = resolveSearchTypeLabel(search);
  if (searchTypeLabel && candidate.typeLabel === searchTypeLabel) {
    score += 55;
  }
  if (search?.cityLabel && candidate.city === search.cityLabel) {
    score += 40;
  }
  if (search?.districtLabel && candidate.district === search.districtLabel) {
    score += 25;
  }
  const query = search?.query?.trim().toLocaleLowerCase("tr-TR");
  if (query) {
    const name = candidate.name.toLocaleLowerCase("tr-TR");
    const snippet = candidate.snippet?.toLocaleLowerCase("tr-TR") ?? "";
    if (name.includes(query) || snippet.includes(query)) {
      score += 35;
    } else {
      const tokens = query.split(/\s+/).filter((token) => token.length > 2);
      for (const token of tokens) {
        if (name.includes(token) || snippet.includes(token)) {
          score += 10;
        }
      }
    }
  }
  if (search?.verified && candidate.badges?.verified) {
    score += 10;
  }
  if (search?.premium && candidate.badges?.premium) {
    score += 8;
  }

  return score;
}

function getGeminiApiKey(): string | undefined {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim() ||
    undefined
  );
}

async function enhanceWithGemini(input: {
  profile: ParentPreferenceProfile;
  favorites: readonly ParentFavoriteInput[];
  candidates: readonly InstitutionCardViewData[];
  search?: AiRecommendationSearchContext;
}): Promise<{ summary: string; ids: string[] } | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey || input.candidates.length === 0) {
    return null;
  }

  const model = process.env.EDUATLAS_AI_MODEL?.trim() || "gemini-2.0-flash";
  const searchDescription = describeSearchContext(input.search);
  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: [
              "Sen EduAtlas veli danışmanısın. Favori kurumları ve kullanıcının aktif aramasını birlikte analiz et,",
              "kısa bir veli profili yaz ve aday listesinden en uygun 3 kurum id'sini seç.",
              "Öneriler mutlaka aktif arama bağlamına uygun olmalı (kelime, şehir, ilçe, tür filtreleri).",
              "Yalnızca JSON döndür: {\"summary\":\"...\",\"ids\":[\"id1\",\"id2\",\"id3\"]}",
              "",
              `Aktif arama: ${searchDescription}`,
              `Mevcut profil özeti: ${input.profile.summary}`,
              `Favoriler: ${JSON.stringify(
                input.favorites.map((item) => ({
                  id: item.id,
                  name: item.name,
                  type: item.typeLabel,
                  city: item.city,
                  district: item.district,
                  verified: Boolean(item.badges?.verified),
                  premium: Boolean(item.badges?.premium),
                })),
              )}`,
              `Adaylar: ${JSON.stringify(
                input.candidates.map((item) => ({
                  id: item.id,
                  name: item.name,
                  type: item.typeLabel,
                  city: item.city,
                  district: item.district,
                  verified: Boolean(item.badges?.verified),
                  premium: Boolean(item.badges?.premium),
                })),
              )}`,
            ].join("\n"),
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) {
      return null;
    }
    const parsed = JSON.parse(text) as { summary?: unknown; ids?: unknown };
    const summary =
      typeof parsed.summary === "string" && parsed.summary.trim()
        ? parsed.summary.trim()
        : input.profile.summary;
    const allowed = new Set(input.candidates.map((item) => item.id));
    const ids = Array.isArray(parsed.ids)
      ? parsed.ids
          .filter((id): id is string => typeof id === "string" && allowed.has(id))
          .slice(0, 3)
      : [];
    if (ids.length === 0) {
      return null;
    }
    return { summary, ids };
  } catch {
    return null;
  }
}

function buildSearchFilters(search?: AiRecommendationSearchContext) {
  const type = search?.type?.trim();
  return {
    ...(search?.cityId?.trim() ? { cityId: search.cityId.trim() } : {}),
    ...(search?.districtId?.trim() ? { districtId: search.districtId.trim() } : {}),
    ...(type && isInstitutionType(type) ? { primaryType: type as InstitutionType } : {}),
    ...(search?.verified ? { verification: InstitutionVerification.Verified } : {}),
    ...(search?.premium ? { isPremium: true } : {}),
  };
}

function withSearchAwareSummary(
  profile: ParentPreferenceProfile,
  search?: AiRecommendationSearchContext,
): ParentPreferenceProfile {
  const searchDescription = describeSearchContext(search);
  if (!search || searchDescription.startsWith("Genel keşif")) {
    return profile;
  }
  return {
    ...profile,
    summary: `${profile.summary} Aktif arama: ${searchDescription}.`,
  };
}

/**
 * Builds personalized institution recommendations from parent favorites,
 * ranked against the user's current search context when provided.
 */
export async function buildAiRecommendationsFromFavorites(
  favorites: readonly ParentFavoriteInput[],
  search?: AiRecommendationSearchContext,
): Promise<AiRecommendationsResult> {
  if (favorites.length < MIN_FAVORITES_FOR_AI) {
    throw new Error(`En az ${MIN_FAVORITES_FOR_AI} favori gerekli.`);
  }

  const profile = withSearchAwareSummary(buildParentPreferenceProfile(favorites), search);
  const favoriteIds = new Set(favorites.map((item) => item.id));
  const catalog = await searchPublicInstitutions({
    text: search?.query?.trim() ?? "",
    page: 1,
    pageSize: 100,
    filters: buildSearchFilters(search),
  });
  const ranked = catalog.institutions
    .filter((item) => !favoriteIds.has(item.id))
    .map((item) => ({ item, score: scoreCandidate(item, profile, search) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name, "tr"));

  let shortlist = ranked.slice(0, 12).map((entry) => entry.item);

  // If the active search is too narrow for a shortlist, widen once without text
  // but keep location/type filters so recommendations stay search-relevant.
  if (shortlist.length < 3 && (search?.query?.trim() || search?.districtId)) {
    const widened = await searchPublicInstitutions({
      text: "",
      page: 1,
      pageSize: 100,
      filters: buildSearchFilters({
        ...search,
        query: undefined,
        districtId: search?.districtId && shortlist.length === 0 ? undefined : search?.districtId,
      }),
    });
    const widenedRanked = widened.institutions
      .filter((item) => !favoriteIds.has(item.id))
      .map((item) => ({ item, score: scoreCandidate(item, profile, search) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name, "tr"));
    const seen = new Set(shortlist.map((item) => item.id));
    for (const entry of widenedRanked) {
      if (seen.has(entry.item.id)) {
        continue;
      }
      shortlist.push(entry.item);
      seen.add(entry.item.id);
      if (shortlist.length >= 12) {
        break;
      }
    }
  }

  const llm = await enhanceWithGemini({
    profile,
    favorites,
    candidates: shortlist,
    search,
  });

  if (llm) {
    const byId = new Map(shortlist.map((item) => [item.id, item]));
    const institutions = llm.ids
      .map((id) => byId.get(id))
      .filter((item): item is InstitutionCardViewData => Boolean(item));
    return {
      profile: { ...profile, summary: llm.summary },
      institutions: institutions.length > 0 ? institutions : shortlist.slice(0, 3),
      model: process.env.EDUATLAS_AI_MODEL?.trim() || "gemini-2.0-flash",
      usedLlm: true,
    };
  }

  return {
    profile,
    institutions: shortlist.slice(0, 3),
    model: "eduatlas-preference-heuristics",
    usedLlm: false,
  };
}
