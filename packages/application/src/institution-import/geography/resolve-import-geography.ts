import {
  cityIdAsString,
  createInstitutionImport,
  districtIdAsString,
  foldTurkishText,
  type InstitutionImport,
} from "@eduatlas/domain";
import type { CityRepository } from "../../geography/city-repository";
import type { DistrictRepository } from "../../geography/district-repository";
import { buildDefaultShortDescription } from "../normalize/normalize-import-row";

export type ResolveImportGeographyDependencies = Readonly<{
  readonly cityRepository: CityRepository;
  readonly districtRepository: DistrictRepository;
}>;

type GeoIndex = Readonly<{
  citiesByFoldedName: ReadonlyMap<string, { id: string; nameTr: string }>;
  citiesById: ReadonlyMap<string, string>;
  districtsByCityAndName: ReadonlyMap<string, { id: string; nameTr: string }>;
  districtsById: ReadonlyMap<string, string>;
}>;

function districtKey(cityId: string, districtName: string): string {
  return `${cityId}::${foldTurkishText(districtName)}`;
}

async function buildGeoIndex(deps: ResolveImportGeographyDependencies): Promise<GeoIndex> {
  const cities = await deps.cityRepository.list();
  const citiesByFoldedName = new Map<string, { id: string; nameTr: string }>();
  const citiesById = new Map<string, string>();

  for (const city of cities) {
    const id = cityIdAsString(city.id);
    citiesById.set(id, city.nameTr);
    citiesByFoldedName.set(foldTurkishText(city.nameTr), { id, nameTr: city.nameTr });
    if (city.nameEn) {
      citiesByFoldedName.set(foldTurkishText(city.nameEn), { id, nameTr: city.nameTr });
    }
  }

  const districtsByCityAndName = new Map<string, { id: string; nameTr: string }>();
  const districtsById = new Map<string, string>();

  for (const city of cities) {
    const cityId = cityIdAsString(city.id);
    const districts = await deps.districtRepository.listByCityId(cityId);
    for (const district of districts) {
      const districtId = districtIdAsString(district.id);
      districtsById.set(districtId, district.nameTr);
      districtsByCityAndName.set(districtKey(cityId, district.nameTr), {
        id: districtId,
        nameTr: district.nameTr,
      });
      if (district.nameEn) {
        districtsByCityAndName.set(districtKey(cityId, district.nameEn), {
          id: districtId,
          nameTr: district.nameTr,
        });
      }
    }
  }

  return Object.freeze({
    citiesByFoldedName,
    citiesById,
    districtsByCityAndName,
    districtsById,
  });
}

function resolveCity(
  raw: string,
  index: GeoIndex,
): { id: string; nameTr: string } | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const byIdName = index.citiesById.get(trimmed);
  if (byIdName) {
    return { id: trimmed, nameTr: byIdName };
  }

  // Legacy seed ids (city_istanbul) → catalog slug ids (istanbul).
  const withoutCityPrefix = trimmed.replace(/^city_/i, "");
  if (withoutCityPrefix !== trimmed) {
    const aliased = index.citiesById.get(withoutCityPrefix);
    if (aliased) {
      return { id: withoutCityPrefix, nameTr: aliased };
    }
    const byAliasName = index.citiesByFoldedName.get(
      foldTurkishText(withoutCityPrefix.replaceAll("_", " ")),
    );
    if (byAliasName) {
      return byAliasName;
    }
  }

  const folded = foldTurkishText(trimmed);
  const byName = index.citiesByFoldedName.get(folded);
  if (byName) {
    return byName;
  }
  const stripped = trimmed.replace(/^city_/i, "").replaceAll("_", " ");
  return index.citiesByFoldedName.get(foldTurkishText(stripped)) ?? null;
}

function resolveDistrict(
  raw: string,
  cityId: string,
  index: GeoIndex,
): { id: string; nameTr: string } | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const byIdName = index.districtsById.get(trimmed);
  if (byIdName) {
    return { id: trimmed, nameTr: byIdName };
  }
  if (cityId) {
    const byName = index.districtsByCityAndName.get(districtKey(cityId, trimmed));
    if (byName) {
      return byName;
    }
    const stripped = trimmed.replace(/^dist_/i, "").replaceAll("_", " ");
    const byStripped = index.districtsByCityAndName.get(districtKey(cityId, stripped));
    if (byStripped) {
      return byStripped;
    }
    // Legacy seed ids: dist_kadikoy under city istanbul → istanbul-kadikoy
    const legacyLocal = trimmed.replace(/^dist_/i, "").replaceAll("_", "-");
    const composed = `${cityId}-${legacyLocal}`;
    const byComposedName = index.districtsById.get(composed);
    if (byComposedName) {
      return { id: composed, nameTr: byComposedName };
    }
  }
  return null;
}

/**
 * Resolves city/district display names (or ids) to catalog ids and fills shortDescription.
 */
export async function resolveImportGeography(
  rows: readonly InstitutionImport[],
  deps: ResolveImportGeographyDependencies,
): Promise<readonly InstitutionImport[]> {
  const index = await buildGeoIndex(deps);

  return Object.freeze(
    rows.map((row) => {
      const city = resolveCity(row.cityId, index);
      const district = city ? resolveDistrict(row.districtId, city.id, index) : null;
      const cityId = city?.id ?? row.cityId;
      const districtId = district?.id ?? row.districtId;
      const cityLabel = city?.nameTr ?? row.cityId;
      const districtLabel = district?.nameTr ?? row.districtId;
      const shortDescription =
        row.shortDescription.trim() || buildDefaultShortDescription(cityLabel, districtLabel);

      return createInstitutionImport({
        rowNumber: row.rowNumber,
        values: {
          name: row.name,
          slug: row.slug,
          primaryType: row.primaryType,
          cityId,
          districtId,
          address: row.address,
          shortDescription,
          longDescription: row.longDescription,
          phone: row.phone,
          email: row.email,
          whatsappNumber: row.whatsappNumber,
          websiteUrl: row.websiteUrl,
          facebookUrl: row.facebookUrl,
          instagramUrl: row.instagramUrl,
          programsSummary: row.programsSummary,
          ageOrLevelFocus: row.ageOrLevelFocus,
          latitude: row.latitude,
          longitude: row.longitude,
        },
      });
    }),
  );
}
