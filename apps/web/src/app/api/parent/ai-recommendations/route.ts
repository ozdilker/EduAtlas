import { AppRole } from "@eduatlas/domain";
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth/current-session";
import {
  buildAiRecommendationsFromFavorites,
  MIN_FAVORITES_FOR_AI,
  type AiRecommendationSearchContext,
  type ParentFavoriteInput,
} from "@/server/parent/ai-recommendations";

export const dynamic = "force-dynamic";

function isFavoriteInput(value: unknown): value is ParentFavoriteInput {
  if (!value || typeof value !== "object") {
    return false;
  }
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.typeLabel === "string"
  );
}

function parseSearchContext(value: unknown): AiRecommendationSearchContext | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const raw = value as Record<string, unknown>;
  const search: AiRecommendationSearchContext = {
    ...(typeof raw.query === "string" ? { query: raw.query } : {}),
    ...(typeof raw.cityId === "string" ? { cityId: raw.cityId } : {}),
    ...(typeof raw.districtId === "string" ? { districtId: raw.districtId } : {}),
    ...(typeof raw.type === "string" ? { type: raw.type } : {}),
    ...(raw.verified === true ? { verified: true } : {}),
    ...(raw.premium === true ? { premium: true } : {}),
    ...(typeof raw.cityLabel === "string" ? { cityLabel: raw.cityLabel } : {}),
    ...(typeof raw.districtLabel === "string" ? { districtLabel: raw.districtLabel } : {}),
    ...(typeof raw.typeLabel === "string" ? { typeLabel: raw.typeLabel } : {}),
  };
  return Object.keys(search).length > 0 ? search : undefined;
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.user.role !== AppRole.Parent) {
    return NextResponse.json(
      { error: "Yapay zeka önerileri yalnızca kayıtlı veliler içindir." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const favoritesRaw =
    body && typeof body === "object" && "favorites" in body
      ? (body as { favorites?: unknown }).favorites
      : undefined;
  if (!Array.isArray(favoritesRaw)) {
    return NextResponse.json({ error: "Favori listesi gerekli." }, { status: 400 });
  }

  const favorites = favoritesRaw.filter(isFavoriteInput);
  if (favorites.length < MIN_FAVORITES_FOR_AI) {
    return NextResponse.json(
      {
        error: `Öneriler için en az ${MIN_FAVORITES_FOR_AI} favori kurum gerekli.`,
        minFavorites: MIN_FAVORITES_FOR_AI,
        favoriteCount: favorites.length,
      },
      { status: 400 },
    );
  }

  const search =
    body && typeof body === "object" && "search" in body
      ? parseSearchContext((body as { search?: unknown }).search)
      : undefined;

  try {
    const result = await buildAiRecommendationsFromFavorites(favorites, search);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Öneriler oluşturulurken bir hata oluştu.",
      },
      { status: 500 },
    );
  }
}
