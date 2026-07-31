import {
  cityIdAsString,
  createInstitutionImport,
  createPublishedInstitution,
  districtIdAsString,
  evaluateInstitutionQuality,
  type ImportIssue,
  type Institution,
  type InstitutionImport,
  type InstitutionQualityScore,
  importDuplicateKey,
  importIssueError,
  importIssueWarning,
  isInstitutionType,
  isValidInstitutionSlug,
  REQUIRED_INSTITUTION_IMPORT_FIELDS,
  resolveImportSlug,
} from "@eduatlas/domain";
import type { CityRepository } from "../geography/city-repository";
import type { DistrictRepository } from "../geography/district-repository";
import type { InstitutionRepository } from "../institutions/institution-repository";

const REQUIRED_FIELD_LABELS: Readonly<Record<string, string>> = Object.freeze({
  name: "Ad",
  primaryType: "Kurum türü",
  cityId: "Şehir",
  districtId: "İlçe",
  address: "Adres",
  shortDescription: "Kısa açıklama",
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[\d\s()-]{7,20}$/;
const DEFAULT_IMPORT_ADDRESS = "Adres belirtilmedi";

export type ImportRowStatus = "ready" | "warning" | "duplicate" | "invalid";

/**
 * Per-row validation outcome, including slug and quality previews.
 */
export type ValidatedImportRow = Readonly<{
  readonly row: InstitutionImport;
  readonly slugPreview: string;
  readonly status: ImportRowStatus;
  readonly issues: readonly ImportIssue[];
  /** Quality preview from the internal quality engine; null when the row is invalid. */
  readonly qualityPreview: InstitutionQualityScore | null;
}>;

export type ValidateImportInput = Readonly<{
  readonly rows: readonly InstitutionImport[];
  readonly now?: string;
}>;

export type ValidateImportDependencies = Readonly<{
  readonly institutionRepository: InstitutionRepository;
  readonly cityRepository?: CityRepository;
  readonly districtRepository?: DistrictRepository;
}>;

const EXISTING_SCAN_PAGE_SIZE = 1000;
const EXISTING_SCAN_MAX_PAGES = 50;

async function listExistingForDuplicateScan(
  repository: InstitutionRepository,
): Promise<Awaited<ReturnType<InstitutionRepository["list"]>>["items"]> {
  const items: Array<Awaited<ReturnType<InstitutionRepository["list"]>>["items"][number]> = [];
  for (let page = 1; page <= EXISTING_SCAN_MAX_PAGES; page += 1) {
    const existing = await repository.list({
      page,
      pageSize: EXISTING_SCAN_PAGE_SIZE,
    });
    items.push(...existing.items);
    if (items.length >= existing.totalItems || existing.items.length === 0) {
      break;
    }
  }
  return items;
}

/**
 * Validates parsed import rows: required fields, format checks,
 * duplicate detection (in-file and against the repository),
 * slug generation preview, and quality preview. Read-only — never writes.
 */
export async function validateImport(
  input: ValidateImportInput,
  deps: ValidateImportDependencies,
): Promise<readonly ValidatedImportRow[]> {
  const now = input.now ?? new Date().toISOString();

  // Best-effort duplicate scan — never burn the whole import on a quota/list failure.
  let existingItems: Awaited<ReturnType<InstitutionRepository["list"]>>["items"] = [];
  try {
    existingItems = await listExistingForDuplicateScan(deps.institutionRepository);
  } catch (error) {
    console.warn(
      "[eduatlas] validateImport skipped existing-institution scan:",
      error instanceof Error ? error.message : error,
    );
  }

  const existingSlugs = new Set(existingItems.map((item) => item.slug));
  const existingDuplicateKeys = new Set(
    existingItems.map((item) => importDuplicateKey(item.name, item.location.cityId)),
  );

  const knownCityIds = new Set<string>();
  const knownDistrictIds = new Set<string>();
  if (deps.cityRepository) {
    const cities = await deps.cityRepository.list();
    for (const city of cities) {
      const cityId = cityIdAsString(city.id);
      knownCityIds.add(cityId);
      if (deps.districtRepository) {
        const districts = await deps.districtRepository.listByCityId(cityId);
        for (const district of districts) {
          knownDistrictIds.add(districtIdAsString(district.id));
        }
      }
    }
  }

  const seenSlugs = new Set<string>();
  const seenDuplicateKeys = new Set<string>();
  const results: ValidatedImportRow[] = [];

  for (const rawRow of input.rows) {
    const issues: ImportIssue[] = [];
    let isDuplicate = false;

    const row = createInstitutionImport({
      rowNumber: rawRow.rowNumber,
      values: {
        name: rawRow.name,
        slug: rawRow.slug,
        primaryType: rawRow.primaryType,
        cityId: rawRow.cityId,
        districtId: rawRow.districtId,
        address: rawRow.address.trim() || DEFAULT_IMPORT_ADDRESS,
        shortDescription: rawRow.shortDescription,
        longDescription: rawRow.longDescription,
        phone:
          rawRow.phone && PHONE_PATTERN.test(rawRow.phone) ? rawRow.phone : "",
        email:
          rawRow.email && EMAIL_PATTERN.test(rawRow.email) ? rawRow.email : "",
        whatsappNumber: rawRow.whatsappNumber,
        websiteUrl: rawRow.websiteUrl,
        facebookUrl: rawRow.facebookUrl,
        instagramUrl: rawRow.instagramUrl,
        programsSummary: rawRow.programsSummary,
        ageOrLevelFocus: rawRow.ageOrLevelFocus,
        latitude: rawRow.latitude,
        longitude: rawRow.longitude,
      },
    });

    for (const field of REQUIRED_INSTITUTION_IMPORT_FIELDS) {
      if (!row[field]) {
        issues.push(importIssueError(field, `${REQUIRED_FIELD_LABELS[field] ?? field} zorunlu.`));
      }
    }

    if (!rawRow.address.trim()) {
      issues.push(importIssueWarning("address", "Adres yok; varsayılan metin kullanıldı."));
    }

    if (!row.cityId) {
      issues.push(importIssueError("cityId", "Şehir (İl) zorunlu — Excel’de İl sütununu kontrol edin."));
    }

    if (!row.districtId) {
      issues.push(
        importIssueError("districtId", "İlçe zorunlu — Excel’de İlçe sütununu kontrol edin."),
      );
    }

    if (row.primaryType && !isInstitutionType(row.primaryType)) {
      issues.push(
        importIssueError(
          "primaryType",
          `Geçersiz kurum türü: "${row.primaryType}". Beklenen: private_school, dershane, etut_merkezi, language_school, kindergarten, preschool.`,
        ),
      );
    }

    if (row.email && !EMAIL_PATTERN.test(row.email)) {
      issues.push(importIssueWarning("email", "E-posta biçimi geçersiz; yok sayılacak."));
    }

    if (row.phone && !PHONE_PATTERN.test(row.phone)) {
      issues.push(importIssueWarning("phone", "Telefon biçimi geçersiz; yok sayılacak."));
    }

    if (knownCityIds.size > 0 && row.cityId && !knownCityIds.has(row.cityId)) {
      issues.push(importIssueError("cityId", `Şehir katalogda bulunamadı: "${row.cityId}".`));
    }

    if (knownDistrictIds.size > 0 && row.districtId && !knownDistrictIds.has(row.districtId)) {
      issues.push(
        importIssueError("districtId", `İlçe katalogda bulunamadı: "${row.districtId}".`),
      );
    }

    const latitude = parseOptionalCoordinate(row.latitude, -90, 90);
    if (latitude === false) {
      issues.push(importIssueError("latitude", "Enlem -90 ile 90 arasında sayı olmalı."));
    }
    const longitude = parseOptionalCoordinate(row.longitude, -180, 180);
    if (longitude === false) {
      issues.push(importIssueError("longitude", "Boylam -180 ile 180 arasında sayı olmalı."));
    }

    const slugPreview = resolveImportSlug(row);

    if (row.slug && !isValidInstitutionSlug(row.slug)) {
      issues.push(importIssueWarning("slug", `Geçersiz slug; addan üretildi: "${slugPreview}".`));
    }

    if (row.name && !isValidInstitutionSlug(slugPreview)) {
      issues.push(importIssueError("slug", "Addan geçerli bir slug üretilemedi."));
    }

    if (!row.phone && !row.email) {
      issues.push(
        importIssueWarning("phone", "Telefon veya e-posta yok; yayınlama için en az biri gerekli."),
      );
    }

    const duplicateKey = row.name ? importDuplicateKey(row.name, row.cityId) : "";

    if (slugPreview && (existingSlugs.has(slugPreview) || seenSlugs.has(slugPreview))) {
      isDuplicate = true;
      issues.push(
        importIssueWarning(
          "slug",
          seenSlugs.has(slugPreview)
            ? `Dosya içinde yinelenen slug: "${slugPreview}".`
            : `Bu slug zaten kayıtlı: "${slugPreview}".`,
        ),
      );
    }

    if (
      !isDuplicate &&
      duplicateKey &&
      (existingDuplicateKeys.has(duplicateKey) || seenDuplicateKeys.has(duplicateKey))
    ) {
      isDuplicate = true;
      issues.push(
        importIssueWarning("name", "Aynı ad ve şehirde bir kurum zaten mevcut (olası yinelenme)."),
      );
    }

    const hasErrors = issues.some((issue) => issue.severity === "error");
    const status: ImportRowStatus = hasErrors
      ? "invalid"
      : isDuplicate
        ? "duplicate"
        : issues.length > 0
          ? "warning"
          : "ready";

    let qualityPreview: InstitutionQualityScore | null = null;
    let effectiveRow = row;
    let effectiveStatus = status;

    if (!hasErrors) {
      try {
        qualityPreview = evaluateInstitutionQuality({
          institution: buildImportCandidate(effectiveRow, slugPreview, now, {
            latitude: typeof latitude === "number" ? latitude : undefined,
            longitude: typeof longitude === "number" ? longitude : undefined,
          }),
          now,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (/InstitutionSocialLinks\./.test(message)) {
          // Drop bad social URLs rather than failing the whole preview/import.
          effectiveRow = clearImportSocialUrls(row);
          issues.push(
            importIssueWarning(
              "websiteUrl",
              "Geçersiz web/sosyal medya adresi yok sayıldı.",
            ),
          );
          if (effectiveStatus === "ready") {
            effectiveStatus = "warning";
          }
          qualityPreview = evaluateInstitutionQuality({
            institution: buildImportCandidate(effectiveRow, slugPreview, now, {
              latitude: typeof latitude === "number" ? latitude : undefined,
              longitude: typeof longitude === "number" ? longitude : undefined,
            }),
            now,
          });
        } else {
          issues.push(importIssueError("name", message));
          effectiveStatus = "invalid";
          qualityPreview = null;
        }
      }

      if (slugPreview && effectiveStatus !== "duplicate" && effectiveStatus !== "invalid") {
        seenSlugs.add(slugPreview);
        if (duplicateKey) {
          seenDuplicateKeys.add(duplicateKey);
        }
      }
    }

    results.push(
      Object.freeze({
        row: effectiveRow,
        slugPreview,
        status: effectiveStatus,
        issues: Object.freeze(issues),
        qualityPreview,
      }),
    );
  }

  return Object.freeze(results);
}

function clearImportSocialUrls(row: InstitutionImport): InstitutionImport {
  return createInstitutionImport({
    rowNumber: row.rowNumber,
    values: {
      name: row.name,
      slug: row.slug,
      primaryType: row.primaryType,
      cityId: row.cityId,
      districtId: row.districtId,
      address: row.address,
      shortDescription: row.shortDescription,
      longDescription: row.longDescription,
      phone: row.phone,
      email: row.email,
      whatsappNumber: row.whatsappNumber,
      websiteUrl: "",
      facebookUrl: "",
      instagramUrl: "",
      programsSummary: row.programsSummary,
      ageOrLevelFocus: row.ageOrLevelFocus,
      latitude: row.latitude,
      longitude: row.longitude,
    },
  });
}

/**
 * Builds the published Institution an import row would create.
 * Excel/CSV imports go live immediately (no review queue).
 */
export function buildImportCandidate(
  row: InstitutionImport,
  slug: string,
  now: string,
  coordinates: Readonly<{ latitude?: number; longitude?: number }> = {},
): Institution {
  return createPublishedInstitution({
    id: importInstitutionId(slug),
    name: row.name,
    slug,
    primaryType: row.primaryType,
    location: {
      cityId: row.cityId,
      districtId: row.districtId,
      address: row.address,
      ...(coordinates.latitude !== undefined ? { latitude: coordinates.latitude } : {}),
      ...(coordinates.longitude !== undefined ? { longitude: coordinates.longitude } : {}),
    },
    contact: {
      phone: row.phone,
      email: row.email,
      whatsappNumber: row.whatsappNumber,
    },
    socialLinks: {
      websiteUrl: row.websiteUrl,
      facebookUrl: row.facebookUrl,
      instagramUrl: row.instagramUrl,
    },
    shortDescription: row.shortDescription,
    longDescription: row.longDescription || undefined,
    programsSummary: row.programsSummary || undefined,
    ageOrLevelFocus: row.ageOrLevelFocus || undefined,
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
  });
}

/** Deterministic institution id derived from the slug. */
export function importInstitutionId(slug: string): string {
  return `inst_${slug.replaceAll("-", "_")}`.slice(0, 128);
}

/**
 * Returns the parsed number, `undefined` when empty, or `false` when invalid.
 */
function parseOptionalCoordinate(
  raw: string,
  min: number,
  max: number,
): number | undefined | false {
  if (!raw) {
    return undefined;
  }
  const value = Number(raw.replace(",", "."));
  if (Number.isNaN(value) || value < min || value > max) {
    return false;
  }
  return value;
}
