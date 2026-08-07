import type { GrowthProgressView, GrowthSummaryView, GrowthWarmupView } from "./types";
import { Button } from "../../components/button";

export function GrowthSummaryPanel({
  summary,
  progress,
  domainStatus,
  warmup,
  elevateWarmupAction,
  campaignId,
}: {
  summary: GrowthSummaryView | null;
  progress: GrowthProgressView | null;
  domainStatus: string;
  warmup?: GrowthWarmupView;
  elevateWarmupAction?: (formData: FormData) => Promise<void>;
  campaignId?: string;
}) {
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
      {warmup && elevateWarmupAction && warmup.canElevate ? (
        <form action={elevateWarmupAction} className="ea-growth-inline-form">
          {campaignId ? <input type="hidden" name="campaignId" value={campaignId} /> : null}
          <Button type="submit" size="sm">
            Stage Yükselt
          </Button>
        </form>
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
            <span>Toplam eşleşen kurum</span>
            <strong>{summary.segmentMatchCount}</strong>
          </li>
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
