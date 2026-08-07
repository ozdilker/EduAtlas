import type { GrowthProgressView } from "./types";

export function GrowthProgressBar({ progress }: { progress: GrowthProgressView }) {
  const pct = Math.max(0, Math.min(100, progress.percent));
  return (
    <div className="ea-growth-progress" aria-label={`İlerleme ${pct} yüzde`}>
      <div className="ea-growth-progress__track">
        <div className="ea-growth-progress__fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="ea-admin-muted ea-growth-progress__label">
        %{pct} · {progress.sent}/{progress.total} gönderildi
      </p>
    </div>
  );
}
