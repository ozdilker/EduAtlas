import type { GrowthLogRow } from "./types";

export function GrowthAuditLog({ logs }: { logs: readonly GrowthLogRow[] }) {
  return (
    <section className="ea-growth-panel" aria-label="Audit log">
      <h2 className="ea-admin-section-title">Audit log</h2>
      {logs.length === 0 ? (
        <p className="ea-admin-muted">Henüz log yok.</p>
      ) : (
        <ul className="ea-growth-audit">
          {logs.map((log) => (
            <li key={log.id}>
              <span className="ea-growth-audit__meta">
                {new Date(log.at).toLocaleString("tr-TR")} · {log.level}
              </span>
              <span>{log.message}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
