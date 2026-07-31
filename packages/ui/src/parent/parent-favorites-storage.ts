import type { InstitutionCardViewData } from "../institution/institution-card-content";

export const FAVORITES_STORAGE_KEY = "eduatlas:favorite-institutions";

function isInstitutionCard(value: unknown): value is InstitutionCardViewData {
  if (!value || typeof value !== "object") {
    return false;
  }
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.href === "string" &&
    typeof item.typeLabel === "string"
  );
}

export function readFavoriteInstitutions(): InstitutionCardViewData[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isInstitutionCard);
  } catch {
    return [];
  }
}

export function writeFavoriteInstitutions(items: readonly InstitutionCardViewData[]): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("eduatlas:favorites-changed"));
}

export function upsertFavoriteInstitution(item: InstitutionCardViewData): InstitutionCardViewData[] {
  const current = readFavoriteInstitutions();
  const without = current.filter((entry) => entry.id !== item.id);
  const next = [item, ...without];
  writeFavoriteInstitutions(next);
  return next;
}

export function removeFavoriteInstitution(id: string): InstitutionCardViewData[] {
  const next = readFavoriteInstitutions().filter((entry) => entry.id !== id);
  writeFavoriteInstitutions(next);
  return next;
}

export function isFavoriteInstitution(id: string): boolean {
  return readFavoriteInstitutions().some((entry) => entry.id === id);
}

export function toggleFavoriteInstitution(item: InstitutionCardViewData): InstitutionCardViewData[] {
  if (isFavoriteInstitution(item.id)) {
    return removeFavoriteInstitution(item.id);
  }
  return upsertFavoriteInstitution(item);
}
