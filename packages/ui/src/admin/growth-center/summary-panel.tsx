import type { GrowthProgressView, GrowthSummaryView, GrowthWarmupView } from "./types";
import { Button } from "../../components/button";

export function GrowthSummaryPanel({
  summary,
  progress,
  domainStatus,
  warmup,
  elevateWarmupAction,
  lowerWarmupAction,
  campaignId,
}: {
  summary: GrowthSummaryView | null;
  progress: GrowthProgressView | null;
  domainStatus: string;
  warmup?: GrowthWarmupView;
  elevateWarmupAction?: (formData: FormData) => Promise<void>;
  lowerWarmupAction?: (formData: FormData) => Promise<void>;
  campaignId?: string;
}) {
  const showElevate = Boolean(warmup && elevateWarmupAction && warmup.canElevate);
  const showLower = Boolean(warmup && lowerWarmupAction && warmup.canLower);

  return (
    <section className="ea-growth-panel" aria-label="Campaign summary">
      <h2 className="ea-admin-section-title">Campaign Summary</h2>
      {warmup ? (
        <ul className="ea-growth-summary">
          <li>
            <span>Warm-up Stage</span>
            <strong>
              {warmup.stage} (limit {warmup.limit})
            </strong>
          </li>
        </ul>
      ) : null}
      {showElevate || showLower ? (
        <div className="ea-growth-stage-actions">
          {showLower ? (
            <form action={lowerWarmupAction} className="ea-growth-inline-form">
              {campaignId ? <input type="hidden" name="campaignId" value={campaignId} /> : null}
              <Button type="submit" size="sm" variant="secondary">
                Stage İndir
              </Button>
            </form>
          ) : null}
          {showElevate ? (
            <form action={elevateWarmupAction} className="ea-growth-inline-form">
              {campaignId ? <input type="hidden" name="campaignId" value={campaignId} /> : null}
              <Button type="submit" size="sm">
                Stage Yükselt
              </Button>
            </form>
          ) : null}
        </div>
      ) : null}
      {!summary ? (
        <p className="ea-admin-muted">Kampanya seçin veya kaydedin.</p>
      ) : (
        <ul className="ea-growth-summary">
          <li>
            <span>Domain status</span>
            <strong>{domainStatus}</strong>
          </li>
          <li>
            <span>
              {summary.importedRecipientCount !== undefined
                ? "İçe aktarılan alıcı"
                : "Toplam eşleşen kurum"}
            </span>
            <strong>
              {summary.importedRecipientCount ?? summary.segmentMatchCount}
            </strong>
          </li>
          {summary.institutionMatchedCount !== undefined ? (
            <li>
              <span>Kurumla eşleşen</span>
              <strong>{summary.institutionMatchedCount}</strong>
            </li>
          ) : null}
          {summary.institutionMatchPendingCount !== undefined ? (
            <li>
              <span>Eşleşmesi bekleyen</span>
              <strong>{summary.institutionMatchPendingCount}</strong>
            </li>
          ) : null}
          <li>
            <span>Hazırlanan recipient</span>
            <strong>{summary.preparedRecipientCount}</strong>
          </li>
          <li>
            <span>Warm-up limit</span>
            <strong>{summary.warmupLimit}</strong>
          </li>
          <li>
            <span>Gönderilen</span>
            <strong>{progress?.sent ?? 0}</strong>
          </li>
          <li>
            <span>Kalan</span>
            <strong>{summary.remaining}</strong>
          </li>
          <li>
            <span>Failed</span>
            <strong>{progress?.failed ?? 0}</strong>
          </li>
          <li>
            <span>Bounce</span>
            <strong>{progress?.bounced ?? 0}</strong>
          </li>
          <li>
            <span>ETA</span>
            <strong>
              {summary.etaMinutes} dk (~{summary.ratePerMinute}/dk)
            </strong>
          </li>
          {progress ? (
            <li>
              <span>Progress</span>
              <strong>
                {progress.sent}/{progress.total} (%{progress.percent})
              </strong>
            </li>
          ) : null}
          <li>
            <span>Quality score</span>
            <strong>{summary.qualityScore.score}/100</strong>
          </li>
        </ul>
      )}
      {summary ? (
        <details className="ea-growth-quality">
          <summary>Quality faktörleri</summary>
          <ul>
            {summary.qualityScore.factors.map((f) => (
              <li key={f.id}>
                {f.label}: {f.points}/{f.maxPoints}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
