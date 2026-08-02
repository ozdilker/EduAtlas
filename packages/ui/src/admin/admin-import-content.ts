export type AdminImportPhase = "idle" | "preview" | "done" | "error";

export type AdminImportRowStatus = "ready" | "warning" | "duplicate" | "invalid";

export type AdminImportRowView = Readonly<{
  readonly rowNumber: number;
  readonly name: string;
  readonly slugPreview: string;
  readonly typeLabel: string;
  readonly cityId: string;
  readonly districtId: string;
  readonly status: AdminImportRowStatus;
  readonly statusLabel: string;
  readonly outcomeLabel: string;
  readonly qualityScore: number | null;
  readonly qualityGrade: string;
  readonly issues: readonly string[];
}>;

export type AdminImportSummaryView = Readonly<{
  readonly fileName: string;
  readonly formatLabel: string;
  readonly dryRun: boolean;
  readonly totalRows: number;
  readonly importable: number;
  readonly created: number;
  readonly updated: number;
  readonly skipped: number;
  readonly duplicates: number;
  readonly invalid: number;
  readonly failed: number;
}>;

export type AdminImportFormState = Readonly<{
  readonly phase: AdminImportPhase;
  readonly message: string;
  readonly summary: AdminImportSummaryView | null;
  readonly rows: readonly AdminImportRowView[];
  readonly unknownHeaders: readonly string[];
  /** Server-side cached upload token so “İçe aktar” works without re-selecting the file. */
  readonly uploadToken: string | null;
  /** Progress job id for the real-time loading bar. */
  readonly jobId: string | null;
}>;

export const ADMIN_IMPORT_INITIAL_STATE: AdminImportFormState = Object.freeze({
  phase: "idle",
  message: "",
  summary: null,
  rows: Object.freeze([]),
  unknownHeaders: Object.freeze([]),
  uploadToken: null,
  jobId: null,
});

export const ADMIN_IMPORT_ROWS_PAGE_SIZE = 25;

/**
 * Max rows returned in the server-action form state.
 * Large MEB exports (5k–10k+) blow past Next.js action serialization limits if every row is returned.
 */
export const ADMIN_IMPORT_DISPLAY_ROWS_MAX = 200;

const DISPLAY_STATUS_PRIORITY: Readonly<Record<AdminImportRowStatus, number>> = Object.freeze({
  invalid: 0,
  warning: 1,
  duplicate: 2,
  ready: 3,
});

/**
 * Picks a UI sample of import rows: problems first, then ready rows, capped for payload size.
 */
export function selectAdminImportDisplayRows<T extends { readonly status: AdminImportRowStatus }>(
  rows: readonly T[],
  limit: number = ADMIN_IMPORT_DISPLAY_ROWS_MAX,
): readonly T[] {
  if (rows.length <= limit) {
    return rows;
  }
  const ranked = [...rows].sort((a, b) => {
    const pa = DISPLAY_STATUS_PRIORITY[a.status] ?? 99;
    const pb = DISPLAY_STATUS_PRIORITY[b.status] ?? 99;
    if (pa !== pb) return pa - pb;
    return 0;
  });
  return Object.freeze(ranked.slice(0, Math.max(0, limit)));
}


export type AdminImportProgressView = Readonly<{
  readonly phase: string;
  readonly totalRows: number;
  readonly processedRows: number;
  readonly createdCount: number;
  readonly duplicateCount: number;
  readonly invalidCount: number;
  readonly failedCount: number;
  readonly message: string;
  readonly percent: number;
}>;

/** Workflow steps shown in the stepper (DATA-ACQUISITION import flow). */
export const ADMIN_IMPORT_STEPS: readonly string[] = Object.freeze([
  "Yükle",
  "Önizleme",
  "Doğrulama",
  "Yinelenme uyarıları",
  "Kalite önizleme",
  "İçe aktar",
  "Özet",
]);

/**
 * Index of the last completed step for the current phase.
 * Upload→Preview→Validation→Duplicates→Quality happen together in preview.
 */
export function getAdminImportStepIndex(phase: AdminImportPhase): number {
  switch (phase) {
    case "preview":
      return 4;
    case "done":
      return 6;
    default:
      return 0;
  }
}

export function getAdminImportRowStatusLabel(status: AdminImportRowStatus): string {
  switch (status) {
    case "ready":
      return "Hazır";
    case "warning":
      return "Uyarılı";
    case "duplicate":
      return "Yinelenen";
    case "invalid":
      return "Geçersiz";
    default:
      return status;
  }
}

export function getAdminImportOutcomeLabel(outcome: string): string {
  switch (outcome) {
    case "created":
      return "Oluşturuldu";
    case "would_create":
      return "Oluşturulacak";
    case "skipped_duplicate":
      return "Yinelenen — atlandı";
    case "skipped_invalid":
      return "Geçersiz — atlandı";
    case "failed":
      return "Hata";
    default:
      return outcome;
  }
}

/** Expected column headers, shown as upload guidance. */
export const ADMIN_IMPORT_TEMPLATE_COLUMNS: readonly string[] = Object.freeze([
  "Kurum Adı / name (zorunlu)",
  "İl / cityId (konum için gerekli)",
  "İlçe / districtId (konum için gerekli)",
  "Adres (opsiyonel — yoksa varsayılan metin)",
  "Kurum Türü / primaryType (opsiyonel — yoksa özel okul)",
  "Telefon / phone (opsiyonel)",
  "E-posta / email (opsiyonel)",
  "Web Sitesi (opsiyonel)",
  "shortDescription (opsiyonel — yoksa otomatik üretilir)",
  "FAX / kurum kodu vb. ek MEB sütunları yok sayılır",
]);
