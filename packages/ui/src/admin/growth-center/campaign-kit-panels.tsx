"use client";

import { Button } from "../../components/button";
import type {
  GrowthLearningRow,
  GrowthPostSummary,
  GrowthPreSendChecklist,
  GrowthRecipientCheckItem,
} from "./types";

const PRE_SEND_FIELDS: ReadonlyArray<{
  key: keyof GrowthPreSendChecklist;
  label: string;
}> = [
  { key: "subjectOk", label: "Subject onaylı" },
  { key: "ctaOk", label: "CTA / link kontrolü" },
  { key: "testMailSent", label: "Test mail gönderildi" },
  { key: "recipientsReviewed", label: "Recipient listesi incelendi" },
  { key: "warmupOk", label: "Warm-up limiti uygun" },
  { key: "sendApproved", label: "Gönderim onayı" },
];

export function GrowthRecipientChecklist({
  items,
}: {
  items: readonly GrowthRecipientCheckItem[];
}) {
  if (items.length === 0) {
    return <p className="ea-admin-muted">Prepare sonrası otomatik checklist oluşur.</p>;
  }
  return (
    <ul className="ea-growth-checklist">
      {items.map((item) => (
        <li
          key={item.id}
          className={
            item.ok ? "ea-growth-checklist__item--ok" : "ea-growth-checklist__item--bad"
          }
        >
          <span aria-hidden="true">{item.ok ? "✓" : "✗"}</span>
          <div>
            <strong>{item.label}</strong>
            {item.detail ? <p className="ea-admin-muted">{item.detail}</p> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function GrowthPreSendChecklistForm({
  campaignId,
  checklist,
  onChecklistChange,
  complete,
  action,
  canEdit,
}: {
  campaignId: string;
  checklist: GrowthPreSendChecklist;
  onChecklistChange: (next: GrowthPreSendChecklist) => void;
  complete: boolean;
  action?: (formData: FormData) => Promise<void>;
  canEdit: boolean;
}) {
  return (
    <div className="ea-growth-kit-block">
      <h3 className="ea-admin-section-title">Pre-send checklist</h3>
      <p className="ea-admin-muted">
        Run için tüm maddeler işaretli olmalı.
        {complete ? " — Tamam." : " — Eksik var."}
      </p>
      {action && canEdit ? (
        <form action={action} className="ea-growth-checklist-form">
          <input type="hidden" name="campaignId" value={campaignId} />
          {PRE_SEND_FIELDS.map(({ key, label }) => (
            <label key={key} className="ea-growth-check">
              <input
                type="checkbox"
                name={key}
                value="on"
                checked={checklist[key]}
                onChange={(event) =>
                  onChecklistChange({ ...checklist, [key]: event.target.checked })
                }
              />
              <span>{label}</span>
            </label>
          ))}
          <Button type="submit" size="sm">
            Checklist kaydet
          </Button>
        </form>
      ) : (
        <ul className="ea-growth-checklist">
          {PRE_SEND_FIELDS.map(({ key, label }) => (
            <li
              key={key}
              className={
                checklist[key]
                  ? "ea-growth-checklist__item--ok"
                  : "ea-growth-checklist__item--bad"
              }
            >
              <span aria-hidden="true">{checklist[key] ? "✓" : "✗"}</span>
              <strong>{label}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function GrowthPostSummaryPanel({ summary }: { summary: GrowthPostSummary | null }) {
  if (!summary) {
    return (
      <p className="ea-admin-muted">Kampanya tamamlanınca post-summary otomatik oluşur.</p>
    );
  }
  return (
    <ul className="ea-growth-summary">
      <li>
        <span>Recipient</span>
        <strong>{summary.recipientCount}</strong>
      </li>
      <li>
        <span>Sent</span>
        <strong>{summary.sent}</strong>
      </li>
      <li>
        <span>Failed</span>
        <strong>{summary.failed}</strong>
      </li>
      <li>
        <span>Bounce</span>
        <strong>{summary.bounced}</strong>
      </li>
      <li>
        <span>Claimed</span>
        <strong>{summary.claimed}</strong>
      </li>
      <li>
        <span>Premium</span>
        <strong>{summary.premium}</strong>
      </li>
      {typeof summary.durationMs === "number" ? (
        <li>
          <span>Süre</span>
          <strong>{Math.round(summary.durationMs / 60000)} dk</strong>
        </li>
      ) : null}
    </ul>
  );
}

export function GrowthLearningsForm({
  campaignId,
  notes,
  onNotesChange,
  action,
  canEdit,
}: {
  campaignId: string;
  notes: string;
  onNotesChange: (next: string) => void;
  action?: (formData: FormData) => Promise<void>;
  canEdit: boolean;
}) {
  return (
    <div className="ea-growth-kit-block">
      <h3 className="ea-admin-section-title">Learnings</h3>
      {action && canEdit ? (
        <form action={action} className="ea-growth-learnings-form">
          <input type="hidden" name="campaignId" value={campaignId} />
          <label className="ea-admin-field">
            <span>Notlar</span>
            <textarea
              name="notes"
              rows={4}
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
              placeholder="Ne işe yaradı, neyi değiştirirsin?"
            />
          </label>
          <Button type="submit" size="sm">
            Learning kaydet
          </Button>
        </form>
      ) : notes ? (
        <p className="ea-growth-learnings-notes">{notes}</p>
      ) : (
        <p className="ea-admin-muted">Henüz learning notu yok.</p>
      )}
    </div>
  );
}

export function GrowthLearningLog({ rows }: { rows: readonly GrowthLearningRow[] }) {
  if (rows.length === 0) {
    return <p className="ea-admin-muted">Geçmiş kampanya learning’i yok.</p>;
  }
  return (
    <ul className="ea-growth-learning-log">
      {rows.map((row) => (
        <li key={row.campaignId}>
          <strong>{row.name}</strong>
          <p>{row.notes}</p>
          {row.updatedAt ? (
            <span className="ea-growth-audit__meta">{row.updatedAt}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
