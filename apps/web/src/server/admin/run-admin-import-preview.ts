import {
  ImportDataSourceId,
  ImportSourceFormat,
} from "@eduatlas/domain";
import {
  type PreviewImportResult,
  previewImport,
} from "@eduatlas/application";
import type { AdminImportFormState, AdminImportRowView } from "@eduatlas/ui";
import {
  getAdminImportRowStatusLabel,
  selectAdminImportDisplayRows,
} from "@eduatlas/ui";
import { getSeededGeographyRepositories } from "../geography/repository";
import { getInstitutionRepository } from "../institutions/repository";
import { storeImportUpload } from "./import-upload-cache";

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

/**
 * Shared dry-run preview used by the server action and `/api/admin/import-preview`.
 * Caches the upload bytes so a later “İçe aktar” can reuse the same instance /tmp file.
 */
export async function runAdminImportPreview(input: {
  fileName: string;
  content: Uint8Array;
}): Promise<AdminImportFormState> {
  const startedAt = Date.now();
  console.info(
    `[eduatlas] runAdminImportPreview start file=${input.fileName} bytes=${input.content.byteLength}`,
  );

  const uploadToken = await storeImportUpload(input.fileName, input.content);
  const [institutionRepository, geography] = await Promise.all([
    getInstitutionRepository(),
    getSeededGeographyRepositories(),
  ]);

  const preview = await previewImport(
    { fileName: input.fileName, content: input.content },
    {
      institutionRepository,
      cityRepository: geography.cityRepository,
      districtRepository: geography.districtRepository,
    },
  );

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

  console.info(
    `[eduatlas] runAdminImportPreview ok file=${input.fileName} rows=${totalRows} sample=${rows.length} ms=${Date.now() - startedAt}`,
  );

  return {
    phase: "preview",
    message: truncated
      ? `Önizleme hazır (${sourceLabel(preview.sourceId)}): ${preview.result.wouldCreateCount} satır yayına alınabilir, ${skipped} atlanacak${noteSuffix}. Tabloda ${rows.length}/${totalRows} örnek satır gösteriliyor (önce sorunlu satırlar). Dosya sunucuda tutuluyor — yeniden seçmeden “İçe aktar”a basabilirsiniz.`
      : `Önizleme hazır (${sourceLabel(preview.sourceId)}): ${preview.result.wouldCreateCount} satır yayına alınabilir, ${skipped} atlanacak${noteSuffix}. Dosya sunucuda tutuluyor — yeniden seçmeden “İçe aktar”a basabilirsiniz.`,
    summary: {
      fileName: input.fileName,
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
