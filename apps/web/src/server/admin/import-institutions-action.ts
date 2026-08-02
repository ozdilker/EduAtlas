"use server";

import {
  type ExecuteImportResult,
  executeImport,
  isImportFileError,
  type PreviewImportResult,
  previewImport,
} from "@eduatlas/application";
import { ImportDataSourceId, ImportSourceFormat } from "@eduatlas/domain";
import type { AdminImportFormState, AdminImportRowView } from "@eduatlas/ui";
import {
  getAdminImportOutcomeLabel,
  getAdminImportRowStatusLabel,
  selectAdminImportDisplayRows,
} from "@eduatlas/ui";
import { revalidatePath } from "next/cache";
import { getSeededGeographyRepositories } from "../geography/repository";
import {
  getInstitutionRepository,
  resetInstitutionRepository,
} from "../institutions/repository";
import { writeImportProgress } from "./import-progress-store";
import {
  deleteImportUpload,
  getImportUpload,
  storeImportUpload,
} from "./import-upload-cache";

function createServerJobId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, "0").slice(-12)}`;
}

const TYPE_LABELS: Readonly<Record<string, string>> = Object.freeze({
  private_school: "Özel Okul",
  dershane: "Dershane",
  etut_merkezi: "Etüt Merkezi",
  language_school: "Dil Okulu",
  kindergarten: "Anaokulu",
  preschool: "Kreş",
});

function formatLabel(format: ImportSourceFormat): string {
  switch (format) {
    case ImportSourceFormat.Csv:
      return "CSV";
    case ImportSourceFormat.Xls:
      return "Excel (.xls)";
    case ImportSourceFormat.Xlsx:
      return "Excel (.xlsx)";
    default:
      return format;
  }
}

function sourceLabel(sourceId: ImportDataSourceId): string {
  switch (sourceId) {
    case ImportDataSourceId.MebExcel:
      return "MEB Kurum Listesi";
    case ImportDataSourceId.CanonicalCsv:
      return "EduAtlas CSV";
    case ImportDataSourceId.CanonicalExcel:
      return "EduAtlas Excel";
    default:
      return sourceId;
  }
}

function errorState(
  message: string,
  uploadToken: string | null = null,
  jobId: string | null = null,
): AdminImportFormState {
  return {
    phase: "error",
    message,
    summary: null,
    rows: [],
    unknownHeaders: [],
    uploadToken,
    jobId,
  };
}

type ResolvedImportFile = Readonly<{
  fileName: string;
  content: Uint8Array;
  uploadToken: string;
}>;

async function resolveImportFile(
  formData: FormData,
  prevState: AdminImportFormState,
): Promise<ResolvedImportFile | { error: string; uploadToken: string | null }> {
  const file = formData.get("file");
  const tokenFromForm = String(formData.get("uploadToken") ?? "").trim();
  const previousToken = prevState.uploadToken?.trim() || tokenFromForm || null;

  if (file instanceof File && file.size > 0) {
    const content = new Uint8Array(await file.arrayBuffer());
    const uploadToken = await storeImportUpload(file.name, content);
    if (previousToken && previousToken !== uploadToken) {
      await deleteImportUpload(previousToken);
    }
    return { fileName: file.name, content, uploadToken };
  }

  const token = tokenFromForm || prevState.uploadToken || "";
  if (token) {
    const cached = await getImportUpload(token);
    if (cached) {
      return {
        fileName: cached.fileName,
        content: cached.content,
        uploadToken: cached.token,
      };
    }
  }

  return {
    error:
      "Lütfen bir .csv, .xlsx veya .xls dosyası seçin. Önizlemeden sonra dosya tarayıcıda sıfırlanır; aynı oturumda “İçe aktar” önbellekteki dosyayı kullanır — önce Önizle’ye basın.",
    uploadToken: previousToken,
  };
}

/**
 * Server action for /admin/import — upload → preview (dry-run) → execute.
 */
export async function importInstitutionsAction(
  prevState: AdminImportFormState,
  formData: FormData,
): Promise<AdminImportFormState> {
  const mode = String(formData.get("mode") ?? "preview");
  const forceDryRun = formData.get("dryRun") === "1";
  const jobIdRaw = String(formData.get("jobId") ?? "").trim();
  const jobId =
    mode === "execute"
      ? /^[0-9a-f-]{36}$/i.test(jobIdRaw)
        ? jobIdRaw
        : createServerJobId()
      : /^[0-9a-f-]{36}$/i.test(jobIdRaw)
        ? jobIdRaw
        : null;

  const resolved = await resolveImportFile(formData, prevState);
  if ("error" in resolved) {
    return errorState(resolved.error, resolved.uploadToken, jobId);
  }

  const { fileName, content, uploadToken } = resolved;
  const startedAt = Date.now();

  try {
    // Only wipe the singleton before execute (quota recovery). Preview must keep
    // the in-process listAll cache — resetting forces a full catalog download.
    if (mode === "execute") {
      resetInstitutionRepository();
    }

    const [institutionRepository, geography] = await Promise.all([
      getInstitutionRepository(),
      getSeededGeographyRepositories(),
    ]);

    const deps = {
      institutionRepository,
      cityRepository: geography.cityRepository,
      districtRepository: geography.districtRepository,
    };

    if (mode === "execute") {
      const dryRun = forceDryRun;
      if (jobId) {
        await writeImportProgress({
          jobId,
          phase: "queued",
          fileName,
          totalRows: 0,
          processedRows: 0,
          createdCount: 0,
          duplicateCount: 0,
          invalidCount: 0,
          failedCount: 0,
          message: "İçe aktarma başlıyor…",
          updatedAt: Date.now(),
        });
      }

      const execution = await executeImport(
        { fileName, content, dryRun, jobId: jobId ?? undefined },
        {
          ...deps,
          onProgress: jobId
            ? async (progress) => {
                await writeImportProgress({
                  jobId,
                  phase: progress.phase === "done" ? "done" : progress.phase,
                  fileName,
                  totalRows: progress.totalRows,
                  processedRows: progress.processedRows,
                  createdCount: progress.createdCount,
                  duplicateCount: progress.duplicateCount,
                  invalidCount: progress.invalidCount,
                  failedCount: progress.failedCount,
                  message: progress.message,
                  updatedAt: Date.now(),
                });
              }
            : undefined,
        },
      );

      if (!dryRun) {
        await deleteImportUpload(uploadToken);
        if (execution.result.createdCount > 0) {
          revalidatePath("/admin/acquisition");
          revalidatePath("/admin/import");
          revalidatePath("/admin/review");
          revalidatePath("/search");
          revalidatePath("/cities");
          revalidatePath("/");
        }
      }

      console.info(
        `[eduatlas] importInstitutionsAction execute ok file=${fileName} rows=${execution.result.totalRows} ms=${Date.now() - startedAt}`,
      );
      return buildExecuteState(fileName, execution, dryRun, dryRun ? uploadToken : null, jobId);
    }

    const preview = await previewImport({ fileName, content }, deps);
    console.info(
      `[eduatlas] importInstitutionsAction preview ok file=${fileName} rows=${preview.result.totalRows} bytes=${content.byteLength} ms=${Date.now() - startedAt}`,
    );
    return buildPreviewState(fileName, preview, uploadToken);
  } catch (error) {
    console.error(
      `[eduatlas] importInstitutionsAction failed mode=${mode} file=${fileName} bytes=${content.byteLength} ms=${Date.now() - startedAt}:`,
      error,
    );
    if (jobId) {
      await writeImportProgress({
        jobId,
        phase: "error",
        fileName,
        totalRows: 0,
        processedRows: 0,
        createdCount: 0,
        duplicateCount: 0,
        invalidCount: 0,
        failedCount: 0,
        message: error instanceof Error ? error.message : "İçe aktarma hatası",
        updatedAt: Date.now(),
      });
    }
    if (isImportFileError(error)) {
      return errorState(error.message, uploadToken, jobId);
    }
    const message =
      error instanceof Error
        ? error.message
        : "İçe aktarma sırasında beklenmeyen bir hata oluştu.";
    if (/RESOURCE_EXHAUSTED|Quota exceeded/i.test(message)) {
      return errorState(
        "Firestore kotası doldu. Yazmalar küçük partiler halinde yeniden denendi; kota sıfırlanınca tekrar “İçe aktar”a basın. Başarılı satırlar kaydedilmiş olabilir.",
        uploadToken,
        jobId,
      );
    }
    return errorState(message, uploadToken, jobId);
  }
}

function mapValidatedToRowView(
  item: PreviewImportResult["rows"][number],
): AdminImportRowView {
  return {
    rowNumber: item.row.rowNumber,
    name: item.row.name,
    slugPreview: item.slugPreview,
    typeLabel: TYPE_LABELS[item.row.primaryType] ?? item.row.primaryType ?? "—",
    cityId: item.row.cityId,
    districtId: item.row.districtId,
    status: item.status,
    statusLabel: getAdminImportRowStatusLabel(item.status),
    outcomeLabel: "",
    qualityScore: item.qualityPreview?.score ?? null,
    qualityGrade: item.qualityPreview?.grade ?? "",
    issues: item.issues.map((issue) => issue.message),
  };
}

function mapExecutedToRowView(
  item: ExecuteImportResult["rows"][number],
): AdminImportRowView {
  return {
    rowNumber: item.validated.row.rowNumber,
    name: item.validated.row.name,
    slugPreview: item.validated.slugPreview,
    typeLabel:
      TYPE_LABELS[item.validated.row.primaryType] ?? item.validated.row.primaryType ?? "—",
    cityId: item.validated.row.cityId,
    districtId: item.validated.row.districtId,
    status: item.validated.status,
    statusLabel: getAdminImportRowStatusLabel(item.validated.status),
    outcomeLabel: getAdminImportOutcomeLabel(item.outcome),
    qualityScore: item.validated.qualityPreview?.score ?? null,
    qualityGrade: item.validated.qualityPreview?.grade ?? "",
    issues: [
      ...item.validated.issues.map((issue) => issue.message),
      ...(item.errorMessage ? [item.errorMessage] : []),
    ],
  };
}

function buildPreviewState(
  fileName: string,
  preview: PreviewImportResult,
  uploadToken: string,
): AdminImportFormState {
  const displaySource = selectAdminImportDisplayRows(preview.rows);
  const rows = displaySource.map(mapValidatedToRowView);
  const totalRows = preview.result.totalRows;
  const truncated = totalRows > rows.length;

  const skipped = preview.result.duplicateCount + preview.result.invalidCount;
  const largeFileNotes: string[] = [];
  if (preview.qualityPreviewSkipped) {
    largeFileNotes.push("kalite skoru atlandı");
  }
  if (preview.existingDuplicateScanSkipped) {
    largeFileNotes.push("katalog yinelenme taraması içe aktarmada yapılacak");
  }
  const noteSuffix = largeFileNotes.length > 0 ? ` (${largeFileNotes.join("; ")})` : "";

  return {
    phase: "preview",
    message: truncated
      ? `Önizleme hazır (${sourceLabel(preview.sourceId)}): ${preview.result.wouldCreateCount} satır yayına alınabilir, ${skipped} atlanacak${noteSuffix}. Tabloda ${rows.length}/${totalRows} örnek satır gösteriliyor (önce sorunlu satırlar). Dosya sunucuda tutuluyor — yeniden seçmeden “İçe aktar”a basabilirsiniz.`
      : `Önizleme hazır (${sourceLabel(preview.sourceId)}): ${preview.result.wouldCreateCount} satır yayına alınabilir, ${skipped} atlanacak${noteSuffix}. Dosya sunucuda tutuluyor — yeniden seçmeden “İçe aktar”a basabilirsiniz.`,
    summary: {
      fileName,
      formatLabel: `${formatLabel(preview.job.sourceFormat)} · ${sourceLabel(preview.sourceId)}`,
      dryRun: true,
      totalRows: preview.result.totalRows,
      importable: preview.result.wouldCreateCount,
      created: 0,
      updated: 0,
      skipped,
      duplicates: preview.result.duplicateCount,
      invalid: preview.result.invalidCount,
      failed: 0,
    },
    rows,
    unknownHeaders: preview.unknownHeaders,
    uploadToken,
    jobId: null,
  };
}

function buildExecuteState(
  fileName: string,
  execution: ExecuteImportResult,
  dryRun: boolean,
  uploadToken: string | null,
  jobId: string | null,
): AdminImportFormState {
  const displayValidated = selectAdminImportDisplayRows(
    execution.rows.map((item) => item.validated),
  );
  const byRowNumber = new Map(
    execution.rows.map((item) => [item.validated.row.rowNumber, item] as const),
  );
  const rows = displayValidated
    .map((validated) => byRowNumber.get(validated.row.rowNumber))
    .filter((item): item is ExecuteImportResult["rows"][number] => Boolean(item))
    .map(mapExecutedToRowView);
  const truncated = execution.rows.length > rows.length;

  const skipped = execution.result.duplicateCount + execution.result.invalidCount;
  const alreadyInDb =
    !dryRun &&
    execution.result.createdCount === 0 &&
    execution.result.duplicateCount > 0 &&
    execution.result.failedCount === 0;
  const baseMessage = dryRun
    ? `Deneme tamamlandı (${sourceLabel(execution.sourceId)}): ${execution.result.wouldCreateCount} satır aktarılabilirdi. Hiçbir şey yazılmadı.`
    : alreadyInDb
      ? `İçe aktarma tamamlandı (${sourceLabel(execution.sourceId)}): 0 yeni kurum — ${execution.result.duplicateCount} satır zaten Firestore’da kayıtlı (yinelenen). /admin/published sayfasından kontrol edin.`
      : `İçe aktarma tamamlandı (${sourceLabel(execution.sourceId)}): ${execution.result.createdCount} kurum yayına alındı, ${skipped} satır atlandı${execution.result.failedCount ? `, ${execution.result.failedCount} hatalı` : ""}.`;
  const message = truncated
    ? `${baseMessage} Tabloda ${rows.length}/${execution.rows.length} örnek satır gösteriliyor.`
    : baseMessage;

  return {
    phase: "done",
    message,
    summary: {
      fileName,
      formatLabel: `${formatLabel(execution.job.sourceFormat)} · ${sourceLabel(execution.sourceId)}`,
      dryRun,
      totalRows: execution.result.totalRows,
      importable: execution.result.wouldCreateCount,
      created: execution.result.createdCount,
      updated: 0,
      skipped,
      duplicates: execution.result.duplicateCount,
      invalid: execution.result.invalidCount,
      failed: execution.result.failedCount,
    },
    rows,
    unknownHeaders: execution.unknownHeaders,
    uploadToken,
    jobId,
  };
}
