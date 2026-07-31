/**
 * Institution amenities / facilities (multi-select, catalog-driven).
 * Extend by appending to INSTITUTION_AMENITY_IDS + labels.
 */

export const INSTITUTION_AMENITY_IDS = [
  "shuttle",
  "cafeteria",
  "parking",
  "counseling",
  "library",
  "laboratory",
  "cameras",
  "security",
  "gym",
  "robotics_workshop",
] as const;

export type InstitutionAmenityId = (typeof INSTITUTION_AMENITY_IDS)[number];

export const INSTITUTION_AMENITY_LABELS_TR: Readonly<Record<InstitutionAmenityId, string>> =
  Object.freeze({
    shuttle: "Servis",
    cafeteria: "Yemekhane",
    parking: "Otopark",
    counseling: "Rehberlik",
    library: "Kütüphane",
    laboratory: "Laboratuvar",
    cameras: "Kamera",
    security: "Güvenlik",
    gym: "Spor Salonu",
    robotics_workshop: "Robotik Atölyesi",
  });

/** Selected amenity ids (stable order matching catalog). */
export type InstitutionAmenities = readonly InstitutionAmenityId[];

export function isInstitutionAmenityId(value: string): value is InstitutionAmenityId {
  return (INSTITUTION_AMENITY_IDS as readonly string[]).includes(value);
}

/**
 * Normalizes a multi-select amenities list.
 * Unknown ids are dropped; duplicates removed; catalog order preserved.
 */
export function createInstitutionAmenities(
  input: readonly string[] | undefined = [],
): InstitutionAmenities {
  const selected = new Set(
    (input ?? []).map((value) => value.trim()).filter((value) => isInstitutionAmenityId(value)),
  );

  const amenities = INSTITUTION_AMENITY_IDS.filter((id) => selected.has(id));
  return Object.freeze(amenities);
}

/**
 * Catalog entries for forms / UI (easy to map to checkboxes).
 */
export function listInstitutionAmenityOptions(
  selected: readonly string[] | undefined = [],
): readonly Readonly<{ id: InstitutionAmenityId; label: string; selected: boolean }>[] {
  const selectedSet = new Set(createInstitutionAmenities(selected));
  return Object.freeze(
    INSTITUTION_AMENITY_IDS.map((id) =>
      Object.freeze({
        id,
        label: INSTITUTION_AMENITY_LABELS_TR[id],
        selected: selectedSet.has(id),
      }),
    ),
  );
}
