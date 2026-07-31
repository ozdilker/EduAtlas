import { foldTurkishText } from "../institution";
import { InstitutionType, isInstitutionType } from "../institution/institution-type";
import type { InstitutionImportField } from "./institution-import";

/**
 * Central column mapping: folded source header → EduAtlas import field.
 * Adapters compose these maps; importers never hardcode source headers.
 */
export type ImportColumnMap = Readonly<Partial<Record<string, InstitutionImportField>>>;

/** Canonical EduAtlas CSV/Excel headers (TR + EN aliases). */
export const CANONICAL_IMPORT_COLUMN_MAP: ImportColumnMap = Object.freeze({
  name: "name",
  ad: "name",
  "kurum adi": "name",
  slug: "slug",
  primarytype: "primaryType",
  "primary type": "primaryType",
  tur: "primaryType",
  "kurum turu": "primaryType",
  cityid: "cityId",
  "city id": "cityId",
  sehir: "cityId",
  il: "cityId",
  districtid: "districtId",
  "district id": "districtId",
  ilce: "districtId",
  address: "address",
  adres: "address",
  shortdescription: "shortDescription",
  "short description": "shortDescription",
  "kisa aciklama": "shortDescription",
  longdescription: "longDescription",
  "long description": "longDescription",
  "uzun aciklama": "longDescription",
  phone: "phone",
  telefon: "phone",
  email: "email",
  eposta: "email",
  "e posta": "email",
  whatsappnumber: "whatsappNumber",
  whatsapp: "whatsappNumber",
  websiteurl: "websiteUrl",
  website: "websiteUrl",
  "web sitesi": "websiteUrl",
  facebookurl: "facebookUrl",
  facebook: "facebookUrl",
  instagramurl: "instagramUrl",
  instagram: "instagramUrl",
  programssummary: "programsSummary",
  programlar: "programsSummary",
  ageorlevelfocus: "ageOrLevelFocus",
  "yas grubu": "ageOrLevelFocus",
  latitude: "latitude",
  enlem: "latitude",
  longitude: "longitude",
  boylam: "longitude",
});

/**
 * MEB "Kurum Listesi" style headers → EduAtlas fields.
 * cityId/districtId receive display names; geography resolution maps them to catalog ids.
 * Supports both spaced headers ("Kurum Türü Adı") and MEB export codes ("KURUM_TUR_ADI").
 */
export const MEB_IMPORT_COLUMN_MAP: ImportColumnMap = Object.freeze({
  "kurum adi": "name",
  "kurumun adi": "name",
  "kurumun resmi adi": "name",
  "okul adi": "name",
  "okulun adi": "name",
  "tesis adi": "name",
  "kurum ismi": "name",
  "okul ismi": "name",
  name: "name",
  ad: "name",
  il: "cityId",
  sehir: "cityId",
  "il adi": "cityId",
  "ilin adi": "cityId",
  ilce: "districtId",
  "ilce adi": "districtId",
  "ilcenin adi": "districtId",
  adres: "address",
  "acik adres": "address",
  "kurum adresi": "address",
  "okul adresi": "address",
  telefon: "phone",
  "telefon no": "phone",
  "telefon numarasi": "phone",
  "iletisim telefonu": "phone",
  tel: "phone",
  email: "email",
  "e-posta": "email",
  eposta: "email",
  "e posta": "email",
  "e mail": "email",
  "web sitesi": "websiteUrl",
  website: "websiteUrl",
  "internet adresi": "websiteUrl",
  "web adresi": "websiteUrl",
  "web adres": "websiteUrl",
  "kurum turu": "primaryType",
  "okul turu": "primaryType",
  "ogretim turu": "primaryType",
  tur: "primaryType",
  "kurum turu adi": "primaryType",
  "kurum tur adi": "primaryType",
  "okul turu adi": "primaryType",
  "okul tur adi": "primaryType",
});

/**
 * MEB / Excel noise headers that are intentionally ignored (not mapped, not warned).
 */
export const IGNORED_IMPORT_HEADERS: ReadonlySet<string> = new Set([
  "fax",
  "faks",
  "fax no",
  "faks no",
  "kurum kodu",
  "okul kodu",
  "kod",
  "sira no",
  "sira",
  "no",
  "il kodu",
  "ilce kodu",
  "kurum turu kodu",
  "kurum tur kodu",
  "okul turu kodu",
  "okul tur kodu",
  "mernis adres kodu",
  "mernis kodu",
  "statu",
  "durum",
  "aciklama",
]);

/** Folded Turkish type labels → InstitutionType. */
const INSTITUTION_TYPE_LABEL_MAP: Readonly<Record<string, InstitutionType>> = Object.freeze({
  "ozel anaokulu": InstitutionType.Kindergarten,
  anaokulu: InstitutionType.Kindergarten,
  kindergarten: InstitutionType.Kindergarten,
  "okul oncesi": InstitutionType.Kindergarten,
  "okul oncesi kurumu": InstitutionType.Kindergarten,
  "ozel turk okul oncesi kurumu": InstitutionType.Kindergarten,
  "ozel okul oncesi kurumu": InstitutionType.Kindergarten,
  "ozel ermeni okul oncesi kurumu": InstitutionType.Kindergarten,
  "ozel musevi okul oncesi kurumu": InstitutionType.Kindergarten,
  "ozel suryani okul oncesi kurumu": InstitutionType.Kindergarten,
  "ozel ozel egitim anaokulu": InstitutionType.Kindergarten,
  "ozel brightkids uluslararasi anaokulu": InstitutionType.Kindergarten,
  kres: InstitutionType.Preschool,
  preschool: InstitutionType.Preschool,
  "ozel kres": InstitutionType.Preschool,
  "cocuk etkinlik ve oyun evi": InstitutionType.Preschool,
  ilkokul: InstitutionType.PrivateSchool,
  "ozel ilkokul": InstitutionType.PrivateSchool,
  "ozel turk ilkokulu": InstitutionType.PrivateSchool,
  ortaokul: InstitutionType.PrivateSchool,
  "ozel ortaokul": InstitutionType.PrivateSchool,
  "ozel turk ortaokulu": InstitutionType.PrivateSchool,
  lise: InstitutionType.PrivateSchool,
  "ozel lise": InstitutionType.PrivateSchool,
  "anadolu lisesi": InstitutionType.PrivateSchool,
  "fen lisesi": InstitutionType.PrivateSchool,
  "ozel anadolu lisesi": InstitutionType.PrivateSchool,
  "ozel fen lisesi": InstitutionType.PrivateSchool,
  "ozel fen ve teknoloji lisesi": InstitutionType.PrivateSchool,
  "ozel mesleki ve teknik anadolu lisesi": InstitutionType.PrivateSchool,
  "ozel aksam lisesi": InstitutionType.PrivateSchool,
  "ozel hazirlik sinifi bulunan anadolu lisesi": InstitutionType.PrivateSchool,
  "ozel hazirlik sinifi bulunan fen lisesi": InstitutionType.PrivateSchool,
  "ozel hazirlik sinifi bulunan fen ve teknoloji lisesi": InstitutionType.PrivateSchool,
  "ozel anadolu guzel sanatlar lisesi": InstitutionType.PrivateSchool,
  "ozel sosyal bilimler lisesi": InstitutionType.PrivateSchool,
  "ozel spor lisesi": InstitutionType.PrivateSchool,
  "ozel milletlerarasi okul": InstitutionType.PrivateSchool,
  "ortaogretim kurumu": InstitutionType.PrivateSchool,
  koleji: InstitutionType.PrivateSchool,
  kolej: InstitutionType.PrivateSchool,
  "ozel okul": InstitutionType.PrivateSchool,
  private_school: InstitutionType.PrivateSchool,
  dershane: InstitutionType.Dershane,
  "ozel dershane": InstitutionType.Dershane,
  "ozel ogretim kursu": InstitutionType.Dershane,
  "ogretim kursu": InstitutionType.Dershane,
  kurs: InstitutionType.Dershane,
  "ozel muhtelif kurslar": InstitutionType.Dershane,
  "muhtelif kurslar": InstitutionType.Dershane,
  "ozel uzaktan egitim kursu": InstitutionType.Dershane,
  "ozel motorlu tasit suruculeri kursu": InstitutionType.Dershane,
  "motorlu tasit suruculeri kursu": InstitutionType.Dershane,
  "isbirligi protokolu kapsaminda acilan kurslar": InstitutionType.Dershane,
  "etut merkezi": InstitutionType.EtutMerkezi,
  etut: InstitutionType.EtutMerkezi,
  etut_merkezi: InstitutionType.EtutMerkezi,
  "sosyal etkinlik ve gelisim merkezi": InstitutionType.EtutMerkezi,
  "sosyal etkinlik merkezi": InstitutionType.EtutMerkezi,
  "gelisim merkezi": InstitutionType.EtutMerkezi,
  "dil kursu": InstitutionType.LanguageSchool,
  "dil okulu": InstitutionType.LanguageSchool,
  language_school: InstitutionType.LanguageSchool,
  "yabanci dil": InstitutionType.LanguageSchool,
  "dil konusma ve ergoterapi merkezi": InstitutionType.LanguageSchool,
  "dil, konusma ve ergoterapi merkezi": InstitutionType.LanguageSchool,
});

/**
 * Maps a free-text / MEB institution type label to a canonical InstitutionType.
 * Unknown labels default to private_school.
 */
export function mapInstitutionTypeLabel(raw: string): InstitutionType {
  const trimmed = raw.trim();
  if (!trimmed) {
    return InstitutionType.PrivateSchool;
  }
  if (isInstitutionType(trimmed)) {
    return trimmed;
  }
  // MEB sometimes leaks numeric type codes — treat as unknown.
  if (/^\d+$/.test(trimmed)) {
    return InstitutionType.PrivateSchool;
  }

  const folded = foldTurkishText(trimmed);
  const exact = INSTITUTION_TYPE_LABEL_MAP[folded];
  if (exact) {
    return exact;
  }

  return resolveInstitutionTypeByHeuristic(folded);
}

/**
 * Contains-based fallback for long MEB `KURUM_TUR_ADI` variants.
 */
function resolveInstitutionTypeByHeuristic(folded: string): InstitutionType {
  if (!folded) {
    return InstitutionType.PrivateSchool;
  }

  if (
    folded.includes("okul oncesi") ||
    folded.includes("anaokulu") ||
    folded.includes("ana okul")
  ) {
    return InstitutionType.Kindergarten;
  }

  if (folded.includes("kres") || folded.includes("oyun evi")) {
    return InstitutionType.Preschool;
  }

  if (
    folded.includes("etut") ||
    folded.includes("sosyal etkinlik") ||
    (folded.includes("gelisim") && folded.includes("merkez"))
  ) {
    return InstitutionType.EtutMerkezi;
  }

  if (
    folded.includes("dil kurs") ||
    folded.includes("dil okul") ||
    folded.includes("yabanci dil") ||
    (folded.includes("dil") && folded.includes("konusma"))
  ) {
    return InstitutionType.LanguageSchool;
  }

  if (
    folded.includes("ogretim kursu") ||
    folded.includes("dershane") ||
    folded.includes("muhtelif kurs") ||
    folded.includes("uzaktan egitim kurs") ||
    folded.includes("motorlu tasit") ||
    folded.includes("surucu") ||
    (folded.includes("kurs") && !folded.includes("rehabilitasyon"))
  ) {
    return InstitutionType.Dershane;
  }

  if (
    folded.includes("ilkokul") ||
    folded.includes("ortaokul") ||
    folded.includes("lise") ||
    folded.includes("ortaogretim") ||
    folded.includes("kolej")
  ) {
    return InstitutionType.PrivateSchool;
  }

  return InstitutionType.PrivateSchool;
}

/**
 * Heuristic fallback when exact map keys miss (MEB variants, newlines, suffixes).
 */
function resolveFieldByHeuristic(folded: string): InstitutionImportField | null {
  if (!folded) {
    return null;
  }

  // Never map code columns via heuristic.
  if (folded.includes("kod")) {
    return null;
  }

  // Avoid matching "kurum kodu", "sira no", etc.
  if (
    (folded.includes("kurum") && folded.includes("adi")) ||
    (folded.includes("okul") && folded.includes("adi")) ||
    (folded.includes("tesis") && folded.includes("adi")) ||
    folded === "kurum adi" ||
    folded === "ad"
  ) {
    if (!folded.includes("tur") && !folded.includes("adres")) {
      return "name";
    }
  }

  if (
    folded === "il" ||
    folded === "sehir" ||
    folded === "il adi" ||
    folded.startsWith("il adi")
  ) {
    return "cityId";
  }

  if (folded === "ilce" || folded === "ilce adi" || folded.startsWith("ilce adi")) {
    return "districtId";
  }

  if (
    folded.includes("adres") &&
    !folded.includes("internet") &&
    !folded.includes("web") &&
    !folded.includes("mernis")
  ) {
    return "address";
  }

  if (folded.includes("telefon") || folded === "tel") {
    return "phone";
  }

  if (folded.includes("posta") || folded.includes("email") || folded.includes("e mail")) {
    return "email";
  }

  if (folded.includes("web") || folded.includes("internet")) {
    return "websiteUrl";
  }

  if (
    (folded.includes("tur") &&
      (folded.includes("kurum") || folded.includes("okul") || folded.includes("ogretim")) &&
      folded.includes("adi")) ||
    folded === "tur" ||
    folded === "kurum turu" ||
    folded === "okul turu"
  ) {
    return "primaryType";
  }

  return null;
}

/**
 * Resolves a header cell against a column map (Turkish-folded, case-insensitive).
 */
export function resolveMappedImportField(
  rawHeader: string,
  columnMap: ImportColumnMap,
): InstitutionImportField | null {
  // MEB / Excel often embeds newlines inside header cells.
  const normalized = rawHeader.replaceAll(/[\r\n]+/g, " ").trim();
  const folded = foldTurkishText(normalized);
  if (!folded) {
    return null;
  }
  if (IGNORED_IMPORT_HEADERS.has(folded)) {
    return null;
  }
  // Underscored MEB exports: KURUM_TUR_KODU, MERNIS_ADRES_KODU, …
  if (folded.includes("kod")) {
    return null;
  }
  return columnMap[folded] ?? resolveFieldByHeuristic(folded);
}

/**
 * Counts how many headers match the given map (for adapter fingerprinting).
 */
export function countMappedHeaders(
  headers: readonly string[],
  columnMap: ImportColumnMap,
): number {
  let count = 0;
  for (const header of headers) {
    if (resolveMappedImportField(header, columnMap)) {
      count += 1;
    }
  }
  return count;
}

/**
 * True when the header row maps at least a name column.
 */
export function headerRowHasNameField(
  headers: readonly string[],
  columnMap: ImportColumnMap,
): boolean {
  return headers.some((header) => resolveMappedImportField(header, columnMap) === "name");
}
