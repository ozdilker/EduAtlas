"use client";

import { useActionState, useEffect, useId, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "../components/button";
import {
  ADMIN_IMPORT_INITIAL_STATE,
  ADMIN_IMPORT_ROWS_PAGE_SIZE,
  ADMIN_IMPORT_STEPS,
  ADMIN_IMPORT_TEMPLATE_COLUMNS,
  type AdminImportFormState,
  type AdminImportProgressView,
  type AdminImportRowView,
  getAdminImportStepIndex,
} from "./admin-import-content";
import { buildAdminNavItems } from "./admin-nav";
import { AdminShell } from "./admin-shell";

export type AdminImportPageProps = {
  action: (prevState: AdminImportFormState, formData: FormData) => Promise<AdminImportFormState>;
  initialState?: AdminImportFormState;
};

function createJobId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, "0").slice(-12)}`;
}

function SubmitButtons({ canExecute }: { canExecute: boolean }) {
  const { pending } = useFormStatus();
  return (
    <div className="ea-admin-import__actions">
      <Button type="submit" name="mode" value="preview" size="sm" disabled={pending}>
        {pending ? "İşleniyor…" : "Önizle (deneme)"}
      </Button>
      <Button
        type="submit"
        name="mode"
        value="execute"
        variant="primary"
        size="sm"
        disabled={pending || !canExecute}
      >
        {pending ? "İçe aktarılıyor…" : "İçe aktar"}
      </Button>
    </div>
  );
}

function ImportProgressBar({
  progress,
  pending,
}: {
  progress: AdminImportProgressView | null;
  pending: boolean;
}) {
  if (!pending && !progress) {
    return null;
  }

  const percent = progress?.percent ?? (pending ? 2 : 0);
  const label = progress?.message ?? (pending ? "İçe aktarma hazırlanıyor…" : "");

  return (
    <section className="ea-admin-import__progress" aria-live="polite" aria-busy={pending}>
      <div className="ea-admin-import__progress-head">
        <h2 className="ea-admin-section-title">İçe aktarma ilerlemesi</h2>
        <span className="ea-admin-muted">{Math.min(100, Math.round(percent))}%</span>
      </div>
      <div
        className="ea-admin-import__progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(100, Math.round(percent))}
        aria-label="İçe aktarma ilerleme çubuğu"
      >
        <div className="ea-admin-import__progress-fill" style={{ width: `${Math.min(100, percent)}%` }} />
      </div>
      <p className="ea-admin-import__progress-message">{label}</p>
      {progress && progress.totalRows > 0 ? (
        <p className="ea-admin-muted">
          {progress.processedRows}/{progress.totalRows} satır · eklenen {progress.createdCount} ·
          yinelenen {progress.duplicateCount} · hatalı {progress.failedCount}
        </p>
      ) : null}
    </section>
  );
}

function ImportRowsPager({ rows }: { rows: readonly AdminImportRowView[] }) {
  const pageSize = ADMIN_IMPORT_ROWS_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [rows]);

  const safePage = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, safePage, pageSize]);

  const from = rows.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, rows.length);

  return (
    <section className="ea-admin-results" aria-labelledby="admin-import-rows-heading">
      <div className="ea-admin-import__rows-header">
        <h2 id="admin-import-rows-heading" className="ea-admin-section-title">
          Satırlar ({rows.length})
        </h2>
        <p className="ea-admin-muted" aria-live="polite">
          {from}–{to} / {rows.length}
        </p>
      </div>

      <div className="ea-admin-table-wrap">
        <table className="ea-admin-table">
          <caption className="ea-sr-only">
            İçe aktarma satırları: doğrulama, yinelenme ve kalite önizlemesi
          </caption>
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Ad</th>
              <th scope="col">Slug önizleme</th>
              <th scope="col">Tür</th>
              <th scope="col">Konum</th>
              <th scope="col">Durum</th>
              <th scope="col">Kalite</th>
              <th scope="col">Uyarılar</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={row.rowNumber} data-duplicate={row.status === "duplicate"}>
                <td>{row.rowNumber}</td>
                <td className="ea-admin-table__name">{row.name || "—"}</td>
                <td>
                  <code>{row.slugPreview || "—"}</code>
                </td>
                <td>{row.typeLabel}</td>
                <td>
                  {row.cityId}
                  {row.districtId ? ` / ${row.districtId}` : ""}
                </td>
                <td>
                  <span
                    className={
                      row.status === "ready"
                        ? "ea-admin-pill"
                        : "ea-admin-pill ea-admin-pill--warn"
                    }
                  >
                    {row.statusLabel}
                  </span>
                  {row.outcomeLabel ? (
                    <span className="ea-admin-muted">{row.outcomeLabel}</span>
                  ) : null}
                </td>
                <td>
                  {row.qualityScore === null ? (
                    <span className="ea-admin-muted">—</span>
                  ) : (
                    <>
                      <span className="ea-admin-score">{row.qualityScore}</span>
                      <span className="ea-admin-pill">{row.qualityGrade}</span>
                    </>
                  )}
                </td>
                <td>
                  {row.issues.length === 0 ? (
                    <span className="ea-admin-muted">—</span>
                  ) : (
                    <ul className="ea-admin-gaps">
                      {row.issues.map((issue) => (
                        <li key={issue}>{issue}</li>
                      ))}
                    </ul>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <nav className="ea-admin-import__pager" aria-label="Önizleme satır sayfaları">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={safePage <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Önceki
          </Button>
          <p className="ea-admin-import__pager-status">
            Sayfa {safePage} / {totalPages}
          </p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={safePage >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            Sonraki
          </Button>
        </nav>
      ) : null}
    </section>
  );
}

function ImportFormBody({
  state,
  canExecute,
  jobId,
}: {
  state: AdminImportFormState;
  canExecute: boolean;
  jobId: string;
}) {
  const { pending } = useFormStatus();
  const fileInputId = useId();
  const dryRunId = useId();
  const hasCachedUpload = Boolean(state.uploadToken);

  return (
    <>
      <input type="hidden" name="jobId" value={jobId} readOnly />
      {state.uploadToken ? (
        <input type="hidden" name="uploadToken" value={state.uploadToken} />
      ) : null}
      <div className="ea-admin-field">
        <label htmlFor={fileInputId}>İçe aktarma dosyası (.csv, .xlsx veya .xls)</label>
        <input
          id={fileInputId}
          name="file"
          type="file"
          accept=".csv,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          required={!hasCachedUpload}
          className="ea-admin-import__file"
          disabled={pending}
        />
        {hasCachedUpload && state.summary?.fileName ? (
          <p className="ea-admin-import__cached-file">
            Önizlenen dosya hazır: <strong>{state.summary.fileName}</strong> — yeniden seçmeden
            içe aktarabilirsiniz.
          </p>
        ) : null}
      </div>
      <div className="ea-admin-import__dry-run">
        <input id={dryRunId} name="dryRun" type="checkbox" value="1" disabled={pending} />
        <label htmlFor={dryRunId}>
          Deneme modu — “İçe aktar”da da hiçbir şey yazma (dry-run)
        </label>
      </div>
      <SubmitButtons canExecute={canExecute} />
      <p className="ea-admin-muted">
        Önce “Önizle”, sonra “İçe aktar”. Büyük MEB listelerinde yazma küçük partiler halinde
        ilerler; yukarıdaki çubuktan takip edebilirsiniz. Aynı dosyayı tekrar içe aktarmak
        yinelenenleri atlar — kurumlar zaten varsa /admin/published’da görünür.
      </p>
    </>
  );
}

/**
 * Institution Import Workflow: upload → preview → validation → import → summary.
 */
export function AdminImportPage({
  action,
  initialState = ADMIN_IMPORT_INITIAL_STATE,
}: AdminImportPageProps) {
  const [activeJobId, setActiveJobId] = useState<string>("");
  const [progress, setProgress] = useState<AdminImportProgressView | null>(null);
  const totalRowsHintRef = useRef(0);

  const wrappedAction = async (
    prevState: AdminImportFormState,
    formData: FormData,
  ): Promise<AdminImportFormState> => {
    if (String(formData.get("mode")) === "execute") {
      const id = createJobId();
      formData.set("jobId", id);
      setActiveJobId(id);
      setProgress({
        phase: "queued",
        totalRows: totalRowsHintRef.current,
        processedRows: 0,
        createdCount: 0,
        duplicateCount: 0,
        invalidCount: 0,
        failedCount: 0,
        message: "İçe aktarma başlıyor…",
        percent: 1,
      });
    }
    return action(prevState, formData);
  };

  const [state, formAction, isPending] = useActionState(wrappedAction, initialState);
  const currentStep = getAdminImportStepIndex(state.phase);
  const hasCachedUpload = Boolean(state.uploadToken);
  const canExecute = state.phase === "preview" && hasCachedUpload;

  useEffect(() => {
    totalRowsHintRef.current = state.summary?.totalRows ?? 0;
  }, [state.summary?.totalRows]);

  useEffect(() => {
    if (!isPending || !activeJobId) {
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const response = await fetch(`/api/admin/import-progress/${activeJobId}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as {
          found?: boolean;
          progress?: {
            phase: string;
            totalRows: number;
            processedRows: number;
            createdCount: number;
            duplicateCount: number;
            invalidCount: number;
            failedCount: number;
            message: string;
          };
        };
        if (cancelled || !payload.found || !payload.progress) {
          return;
        }
        const total = Math.max(payload.progress.totalRows, 1);
        const percent =
          payload.progress.phase === "done"
            ? 100
            : Math.max(1, Math.min(99, (payload.progress.processedRows / total) * 100));
        setProgress({
          ...payload.progress,
          percent,
        });
      } catch {
        // Ignore transient poll errors while the long import runs.
      }
    };

    void poll();
    const timer = window.setInterval(() => {
      void poll();
    }, 700);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isPending, activeJobId]);

  useEffect(() => {
    if (!isPending && state.phase === "done") {
      setProgress((current) =>
        current
          ? { ...current, percent: 100, message: state.message || current.message }
          : current,
      );
    }
  }, [isPending, state.phase, state.message]);

  return (
    <AdminShell activeNavId="import" navItems={buildAdminNavItems()}>
      <header className="ea-admin-page-header">
        <div>
          <h1 className="ea-admin-page-header__title">Kurum içe aktarma</h1>
          <p className="ea-admin-page-header__subtitle">
            MEB Kurum Listesi veya EduAtlas CSV/Excel dosyasından kurumları yayına alın. Zorunlu
            alan yalnızca kurum adıdır; adres/açıklama yoksa otomatik doldurulur.
          </p>
        </div>
      </header>

      <nav aria-label="İçe aktarma adımları">
        <ol className="ea-admin-import__steps">
          {ADMIN_IMPORT_STEPS.map((step, index) => {
            const stepState =
              index < currentStep ? "done" : index === currentStep ? "current" : "todo";
            return (
              <li
                key={step}
                className="ea-admin-import__step"
                data-state={stepState}
                aria-current={stepState === "current" ? "step" : undefined}
              >
                {step}
              </li>
            );
          })}
        </ol>
      </nav>

      {state.message ? (
        <p
          className={
            state.phase === "error"
              ? "ea-admin-import__status ea-admin-import__status--error"
              : "ea-admin-import__status ea-admin-import__status--info"
          }
          role="status"
        >
          {state.message}
        </p>
      ) : null}

      <ImportProgressBar progress={progress} pending={isPending && Boolean(activeJobId)} />

      <section className="ea-admin-import__upload" aria-labelledby="admin-import-upload-heading">
        <h2 id="admin-import-upload-heading" className="ea-admin-section-title">
          1. Dosya yükle
        </h2>
        <form action={formAction} className="ea-admin-import__form">
          <ImportFormBody state={state} canExecute={canExecute} jobId={activeJobId} />
        </form>

        <details className="ea-admin-import__template">
          <summary>Beklenen sütunlar (MEB uyumlu)</summary>
          <ul>
            {ADMIN_IMPORT_TEMPLATE_COLUMNS.map((column) => (
              <li key={column}>{column}</li>
            ))}
          </ul>
        </details>
      </section>

      {state.summary ? (
        <section
          className="ea-admin-import__summary"
          aria-labelledby="admin-import-summary-heading"
        >
          <h2 id="admin-import-summary-heading" className="ea-admin-section-title">
            {state.phase === "done" ? "Özet" : "Önizleme özeti (henüz yazılmadı)"}
          </h2>
          <div className="ea-admin-stats__grid">
            <article className="ea-admin-stat">
              <h3>Dosya</h3>
              <p className="ea-admin-stat__value ea-admin-import__file-name">
                {state.summary.fileName}
              </p>
              <p className="ea-admin-muted">
                {state.summary.formatLabel}
                {state.summary.dryRun ? " · deneme modu" : ""}
              </p>
            </article>
            <article className="ea-admin-stat">
              <h3>Toplam satır</h3>
              <p className="ea-admin-stat__value">{state.summary.totalRows}</p>
            </article>
            <article className="ea-admin-stat">
              <h3>{state.phase === "done" ? "Yeni eklenen" : "Aktarılabilir"}</h3>
              <p className="ea-admin-stat__value">
                {state.phase === "done" ? state.summary.created : state.summary.importable}
              </p>
            </article>
            <article className="ea-admin-stat">
              <h3>Güncellenen</h3>
              <p className="ea-admin-stat__value">{state.summary.updated}</p>
            </article>
            <article className="ea-admin-stat">
              <h3>Atlanan</h3>
              <p className="ea-admin-stat__value">{state.summary.skipped}</p>
            </article>
            <article className="ea-admin-stat">
              <h3>Yinelenen</h3>
              <p className="ea-admin-stat__value">{state.summary.duplicates}</p>
            </article>
            <article className="ea-admin-stat">
              <h3>Geçersiz / hatalı</h3>
              <p className="ea-admin-stat__value">
                {state.summary.invalid + state.summary.failed}
              </p>
            </article>
          </div>
          {state.unknownHeaders.length > 0 ? (
            <p className="ea-admin-muted">
              Tanınmayan sütunlar yok sayıldı: {state.unknownHeaders.join(", ")}
            </p>
          ) : null}
        </section>
      ) : null}

      {state.rows.length > 0 ? <ImportRowsPager rows={state.rows} /> : null}
    </AdminShell>
  );
}
