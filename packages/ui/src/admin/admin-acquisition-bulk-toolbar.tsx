"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";
import { Button } from "../components/button";
import type { AdminAcquisitionRowView } from "./admin-acquisition-content";

export type ApproveInstitutionClaimAction = (
  formData: FormData,
) => Promise<{ ok: boolean; message: string }>;

export type AdminAcquisitionBulkToolbarProps = {
  rows: readonly AdminAcquisitionRowView[];
  note: string;
  approveClaimAction?: ApproveInstitutionClaimAction;
};

const ACTIONS = [
  { id: "approve", label: "Onayla" },
  { id: "reject", label: "Reddet" },
  { id: "assign", label: "Ata" },
  { id: "merge", label: "Birleştir (yakında)", placeholder: true },
] as const;

type ConfirmTarget = Readonly<{
  institutionId: string;
  institutionName: string;
  claimRequestId: string;
  applicantName: string;
  applicantEmail: string;
}>;

/**
 * Selection + bulk chrome; row-level claim approve with confirm dialog.
 */
export function AdminAcquisitionBulkToolbar({
  rows,
  note,
  approveClaimAction,
}: AdminAcquisitionBulkToolbarProps) {
  const liveId = useId();
  const dialogTitleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());
  const [message, setMessage] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(rows.map((row) => row.id)) : new Set());
  }

  function announceAction(label: string) {
    const count = selected.size;
    setMessage(
      count === 0
        ? "Toplu işlem için önce kurum seçin."
        : `"${label}" ${count} kurum için hazırlandı — toplu işlem henüz bağlı değil.`,
    );
  }

  function openConfirm(row: AdminAcquisitionRowView) {
    if (!row.pendingClaim) return;
    setConfirmTarget({
      institutionId: row.id,
      institutionName: row.name,
      claimRequestId: row.pendingClaim.claimRequestId,
      applicantName: row.pendingClaim.applicantName,
      applicantEmail: row.pendingClaim.applicantEmail,
    });
    dialogRef.current?.showModal();
  }

  function closeConfirm() {
    dialogRef.current?.close();
    setConfirmTarget(null);
  }

  function submitApprove() {
    if (!confirmTarget || !approveClaimAction) return;
    const formData = new FormData();
    formData.set("claimRequestId", confirmTarget.claimRequestId);
    formData.set("institutionId", confirmTarget.institutionId);
    startTransition(async () => {
      const result = await approveClaimAction(formData);
      setMessage(result.message);
      if (result.ok) {
        closeConfirm();
        router.refresh();
      }
    });
  }

  const allSelected = rows.length > 0 && selected.size === rows.length;

  return (
    <div className="ea-admin-bulk">
      <div className="ea-admin-bulk__toolbar" role="toolbar" aria-label="Toplu işlemler">
        <label className="ea-admin-bulk__select-all">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(event) => toggleAll(event.target.checked)}
            aria-label="Tüm satırları seç"
          />
          <span>{selected.size > 0 ? `${selected.size} seçili` : "Seçim"}</span>
        </label>

        <div className="ea-admin-bulk__actions">
          {ACTIONS.map((action) => (
            <Button
              key={action.id}
              type="button"
              size="sm"
              variant={action.id === "reject" ? "secondary" : "primary"}
              disabled={"placeholder" in action && action.placeholder}
              onClick={() => announceAction(action.label)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      <p className="ea-admin-bulk__note">{note}</p>
      <div id={liveId} className="ea-sr-only" aria-live="polite">
        {message}
      </div>
      {message ? (
        <p className="ea-admin-bulk__feedback" role="status">
          {message}
        </p>
      ) : null}

      <div className="ea-admin-table-wrap">
        <table className="ea-admin-table">
          <caption className="ea-sr-only">Kurum edinimi kuyruğu</caption>
          <thead>
            <tr>
              <th scope="col">
                <span className="ea-sr-only">Seç</span>
              </th>
              <th scope="col">Kurum</th>
              <th scope="col">Tür</th>
              <th scope="col">Konum</th>
              <th scope="col">Durum</th>
              <th scope="col">Sahiplik</th>
              <th scope="col">Talep</th>
              <th scope="col">Kalite</th>
              <th scope="col">Eksikler</th>
              <th scope="col">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="ea-admin-table__empty">
                  Bu kuyrukta kurum yok. Filtreleri temizleyin veya başka bir kuyruk seçin.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} data-duplicate={row.isDuplicateCandidate ? "true" : undefined}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={() => toggle(row.id)}
                      aria-label={`${row.name} seç`}
                    />
                  </td>
                  <td>
                    <a href={row.profileHref} className="ea-admin-table__name">
                      {row.name}
                    </a>
                    {row.isDuplicateCandidate ? (
                      <span className="ea-admin-pill ea-admin-pill--warn">Yinelenen aday</span>
                    ) : null}
                  </td>
                  <td>{row.typeLabel}</td>
                  <td>
                    {row.cityLabel} / {row.districtLabel}
                  </td>
                  <td>
                    <span className="ea-admin-pill">{row.statusLabel}</span>
                    <span className="ea-admin-muted">{row.verificationLabel}</span>
                  </td>
                  <td>{row.ownershipLabel}</td>
                  <td>
                    {row.pendingClaim ? (
                      <div className="ea-admin-claim-cell">
                        <span>{row.pendingClaim.applicantName}</span>
                        <span className="ea-admin-muted">{row.pendingClaim.applicantEmail}</span>
                      </div>
                    ) : (
                      <span className="ea-admin-muted">—</span>
                    )}
                  </td>
                  <td>
                    <span
                      className="ea-admin-score"
                      title={`İç kalite skoru (Growth Score değil): ${row.qualityBandLabel}`}
                    >
                      {row.qualityScore}
                    </span>
                    <span className="ea-admin-pill" title={`Not ${row.qualityGrade}`}>
                      {row.qualityGrade}
                    </span>
                    <span className="ea-admin-muted">{row.qualityLevelLabel}</span>
                  </td>
                  <td>
                    {row.missingFields.length === 0 && row.indicators.labels.length === 0 ? (
                      <span className="ea-admin-muted">Tam</span>
                    ) : (
                      <ul className="ea-admin-gaps">
                        {row.missingFields.slice(0, 4).map((field) => (
                          <li key={field}>{field}</li>
                        ))}
                        {row.indicators.labels.slice(0, 3).map((label) => (
                          <li key={label}>{label}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td>
                    {row.pendingClaim && approveClaimAction ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => openConfirm(row)}
                        disabled={pending}
                      >
                        Onayla
                      </Button>
                    ) : (
                      <span className="ea-admin-muted">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <dialog
        ref={dialogRef}
        className="ea-admin-claim-dialog"
        aria-labelledby={dialogTitleId}
        onClose={() => setConfirmTarget(null)}
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            closeConfirm();
          }
        }}
      >
        {confirmTarget ? (
          <div className="ea-admin-claim-dialog__panel">
            <h2 id={dialogTitleId} className="ea-admin-claim-dialog__title">
              Sahiplenmeyi onayla
            </h2>
            <p className="ea-admin-claim-dialog__body">
              <strong>{confirmTarget.institutionName}</strong> için{" "}
              <strong>{confirmTarget.applicantName}</strong> (
              {confirmTarget.applicantEmail}) talebini onaylamak üzeresiniz. Kurum doğrulanacak,
              sahiplik bağlanacak ve geçici şifre e-posta ile gönderilecek.
            </p>
            <div className="ea-admin-claim-dialog__actions">
              <Button type="button" size="sm" variant="secondary" onClick={closeConfirm} disabled={pending}>
                İptal
              </Button>
              <Button type="button" size="sm" onClick={submitApprove} disabled={pending}>
                {pending ? "Onaylanıyor…" : "Onayla"}
              </Button>
            </div>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
