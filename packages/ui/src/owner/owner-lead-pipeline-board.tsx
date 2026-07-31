"use client";

import {
  type DragEvent,
  type FormEvent,
  startTransition,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useFormStatus } from "react-dom";
import { Badge } from "../components/badge";
import { Button } from "../components/button";
import { cn } from "../lib/cn";
import {
  getPipelineStatusLabel,
  OWNER_PIPELINE_STATUSES,
  type OwnerLeadListItemView,
  type OwnerLeadPipelineViewData,
  type OwnerPipelineColumnView,
  type OwnerPipelineStatusView,
} from "./owner-portal-content";

export type OwnerLeadPipelineBoardProps = {
  data: OwnerLeadPipelineViewData;
  /** Server action: FormData with leadId + status. */
  action: (formData: FormData) => Promise<void> | void;
  className?: string;
  /** Hide page chrome when embedded inside Talepler workspace. */
  embedded?: boolean;
  selectedLeadId?: string;
  onOpenLead?: (leadId: string) => void;
};

const PIPELINE_SCROLL_KEY = "ea-owner-pipeline-scroll";
const DRAG_MIME = "application/x-eduatlas-lead";

type OptimisticMove = {
  leadId: string;
  toStatus: OwnerPipelineStatusView;
};

function StatusSubmitButton({ label, current }: { label: string; current: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={current ? "primary" : "tertiary"}
      size="sm"
      disabled={pending || current}
      aria-current={current ? "true" : undefined}
    >
      {pending ? "…" : label}
    </Button>
  );
}

function applyOptimisticMove(
  columns: readonly OwnerPipelineColumnView[],
  move: OptimisticMove | null,
): OwnerPipelineColumnView[] {
  if (!move) {
    return columns.map((column) => ({
      ...column,
      leads: [...column.leads],
      count: column.leads.length,
    }));
  }

  let moved: OwnerLeadListItemView | undefined;
  const stripped = columns.map((column) => {
    const remaining = column.leads.filter((lead) => {
      if (lead.id === move.leadId) {
        moved = lead;
        return false;
      }
      return true;
    });
    return { ...column, leads: remaining };
  });

  if (!moved) {
    return stripped.map((column) => ({ ...column, count: column.leads.length }));
  }

  const nextLead: OwnerLeadListItemView = {
    ...moved,
    status: move.toStatus,
    statusLabel: getPipelineStatusLabel(move.toStatus),
  };

  return stripped.map((column) => {
    if (column.status !== move.toStatus) {
      return { ...column, count: column.leads.length };
    }
    const leads = [...column.leads, nextLead];
    return { ...column, leads, count: leads.length };
  });
}

function savePipelineScroll(board: HTMLElement | null) {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(
    PIPELINE_SCROLL_KEY,
    JSON.stringify({
      windowY: window.scrollY,
      boardX: board?.scrollLeft ?? 0,
    }),
  );
}

function restorePipelineScroll(board: HTMLElement | null) {
  if (typeof window === "undefined") {
    return;
  }
  const raw = sessionStorage.getItem(PIPELINE_SCROLL_KEY);
  if (!raw) {
    return;
  }
  try {
    const parsed = JSON.parse(raw) as { windowY?: number; boardX?: number };
    requestAnimationFrame(() => {
      if (typeof parsed.windowY === "number") {
        window.scrollTo(0, parsed.windowY);
      }
      if (board && typeof parsed.boardX === "number") {
        board.scrollLeft = parsed.boardX;
      }
    });
  } catch {
    // ignore corrupt scroll state
  }
}

/**
 * Visual lead pipeline board — drag-and-drop status updates with keyboard/button fallback.
 */
export function OwnerLeadPipelineBoard({
  data,
  action,
  className,
  embedded = false,
  selectedLeadId,
  onOpenLead,
}: OwnerLeadPipelineBoardProps) {
  const boardRef = useRef<HTMLUListElement>(null);
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<OwnerPipelineStatusView | null>(null);
  const [liveMessage, setLiveMessage] = useState("");
  const [optimisticMove, setOptimisticMove] = useState<OptimisticMove | null>(null);

  const columns = applyOptimisticMove(data.columns, optimisticMove);

  // Reset optimistic UI and restore scroll after server revalidation.
  // biome-ignore lint/correctness/useExhaustiveDependencies: must re-run when pipeline snapshot refreshes
  useEffect(() => {
    setOptimisticMove(null);
    restorePipelineScroll(boardRef.current);
  }, [data]);

  async function commitStatusChange(leadId: string, status: OwnerPipelineStatusView) {
    savePipelineScroll(boardRef.current);

    const lead = data.columns.flatMap((column) => column.leads).find((item) => item.id === leadId);
    const fromLabel = lead ? getPipelineStatusLabel(lead.status as OwnerPipelineStatusView) : "";
    const toLabel = getPipelineStatusLabel(status);

    setOptimisticMove({ leadId, toStatus: status });
    setLiveMessage(
      fromLabel
        ? `${lead?.parentName ?? "Talep"} ${fromLabel} → ${toLabel} olarak güncelleniyor.`
        : `Talep durumu ${toLabel} olarak güncelleniyor.`,
    );

    startTransition(() => {
      void (async () => {
        const formData = new FormData();
        formData.set("leadId", leadId);
        formData.set("status", status);
        await action(formData);
        setLiveMessage(
          fromLabel
            ? `${lead?.parentName ?? "Talep"} durumu ${toLabel} sütununa taşındı.`
            : `Talep durumu ${toLabel} olarak güncellendi.`,
        );
      })();
    });
  }

  function handleDragStart(event: DragEvent<HTMLElement>, lead: OwnerLeadListItemView) {
    event.dataTransfer.setData(DRAG_MIME, lead.id);
    event.dataTransfer.setData("text/plain", lead.id);
    event.dataTransfer.effectAllowed = "move";
    setDraggingLeadId(lead.id);
    setLiveMessage(`${lead.parentName} sürükleniyor. Bir sütuna bırakın.`);
  }

  function handleDragEnd() {
    setDraggingLeadId(null);
    setDropTarget(null);
  }

  function handleColumnDragOver(event: DragEvent<HTMLElement>, status: OwnerPipelineStatusView) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dropTarget !== status) {
      setDropTarget(status);
    }
  }

  function handleColumnDragLeave(event: DragEvent<HTMLElement>, status: OwnerPipelineStatusView) {
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) {
      return;
    }
    if (dropTarget === status) {
      setDropTarget(null);
    }
  }

  async function handleColumnDrop(event: DragEvent<HTMLElement>, status: OwnerPipelineStatusView) {
    event.preventDefault();
    const leadId =
      event.dataTransfer.getData(DRAG_MIME) || event.dataTransfer.getData("text/plain");
    setDraggingLeadId(null);
    setDropTarget(null);
    if (!leadId) {
      return;
    }
    const current = data.columns.find((column) =>
      column.leads.some((lead) => lead.id === leadId),
    )?.status;
    if (current === status) {
      return;
    }
    await commitStatusChange(leadId, status);
  }

  const headingId = "owner-pipeline-heading";

  return (
    <section
      className={cn("ea-owner-pipeline", embedded && "ea-owner-pipeline--embedded", className)}
      aria-labelledby={headingId}
    >
      <header className="ea-owner-pipeline__header">
        <div>
          {embedded ? (
            <h2 id={headingId} className="ea-owner-pipeline__title">
              Pipeline
            </h2>
          ) : (
            <h1 id={headingId} className="ea-owner-pipeline__title">
              Talepler — Pipeline
            </h1>
          )}
          <p className="ea-owner-pipeline__description">
            {data.institutionName} — {data.totalInPipeline} talep. Kartları sürükleyerek durumu
            güncelleyin. Yeni talepler “Yeni” sütununda görünür. Klavye için her karttaki durum
            seçicisini kullanın.
          </p>
        </div>
      </header>

      <div className="ea-sr-only" aria-live="polite">
        {liveMessage}
      </div>

      <ul ref={boardRef} className="ea-owner-pipeline__board">
        {columns.map((column) => (
          <li
            key={column.status}
            className={cn(
              "ea-owner-pipeline__column",
              dropTarget === column.status && "ea-owner-pipeline__column--drop-target",
            )}
            aria-labelledby={`pipeline-col-${column.status}`}
            data-status={column.status}
            onDragOver={(event) => handleColumnDragOver(event, column.status)}
            onDragLeave={(event) => handleColumnDragLeave(event, column.status)}
            onDrop={(event) => {
              void handleColumnDrop(event, column.status);
            }}
          >
            <header className="ea-owner-pipeline__column-header">
              <h3 id={`pipeline-col-${column.status}`} className="ea-owner-pipeline__column-title">
                {column.title}
              </h3>
              <span className="ea-owner-pipeline__column-count">
                <span className="ea-sr-only">{column.count} talep</span>
                <span aria-hidden="true">{column.count}</span>
              </span>
            </header>

            {column.leads.length === 0 ? (
              <p className="ea-owner-pipeline__empty" role="status">
                Bu aşamada talep yok
              </p>
            ) : (
              <ul className="ea-owner-pipeline__cards">
                {column.leads.map((lead) => (
                  <li key={lead.id}>
                    <PipelineLeadCard
                      lead={lead}
                      action={action}
                      dragging={draggingLeadId === lead.id}
                      selected={selectedLeadId === lead.id}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onStatusChange={commitStatusChange}
                      onSaveScroll={() => savePipelineScroll(boardRef.current)}
                      onOpenLead={onOpenLead}
                    />
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function PipelineLeadCard({
  lead,
  action,
  dragging,
  selected,
  onDragStart,
  onDragEnd,
  onStatusChange,
  onSaveScroll,
  onOpenLead,
}: {
  lead: OwnerLeadListItemView;
  action: OwnerLeadPipelineBoardProps["action"];
  dragging: boolean;
  selected?: boolean;
  onDragStart: (event: DragEvent<HTMLElement>, lead: OwnerLeadListItemView) => void;
  onDragEnd: () => void;
  onStatusChange: (leadId: string, status: OwnerPipelineStatusView) => Promise<void>;
  onSaveScroll: () => void;
  onOpenLead?: (leadId: string) => void;
}) {
  const current = lead.status as OwnerPipelineStatusView;
  const selectId = useId();
  const phoneHref = `tel:${lead.phone.replace(/\s+/g, "")}`;
  const detailHref = onOpenLead
    ? `/owner/leads?view=pipeline&lead=${encodeURIComponent(lead.id)}`
    : lead.href;

  function handleSelectChange(event: FormEvent<HTMLSelectElement>) {
    const next = event.currentTarget.value as OwnerPipelineStatusView;
    if (!OWNER_PIPELINE_STATUSES.includes(next) || next === current) {
      return;
    }
    void onStatusChange(lead.id, next);
  }

  return (
    <article
      className={cn(
        "ea-owner-pipeline__card",
        dragging && "ea-owner-pipeline__card--dragging",
        selected && "ea-owner-pipeline__card--selected",
      )}
      aria-label={`${lead.parentName}, ${lead.statusLabel}`}
    >
      <div className="ea-owner-pipeline__card-top">
        <button
          type="button"
          className="ea-owner-pipeline__drag-handle"
          draggable
          aria-grabbed={dragging || undefined}
          aria-label={`${lead.parentName} kartını sürükle`}
          onDragStart={(event) => onDragStart(event, lead)}
          onDragEnd={onDragEnd}
        >
          <span aria-hidden="true">⋮⋮</span>
        </button>
        <a
          href={detailHref}
          className="ea-owner-pipeline__card-name"
          aria-current={selected ? "true" : undefined}
          onClick={(event) => {
            if (!onOpenLead || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
              onSaveScroll();
              return;
            }
            event.preventDefault();
            onOpenLead(lead.id);
          }}
        >
          {lead.parentName}
        </a>
        <Badge tone={current === "new" ? "info" : current === "lost" ? "warning" : "neutral"}>
          {getPipelineStatusLabel(current)}
        </Badge>
      </div>

      {lead.interestLabel ? (
        <p className="ea-owner-pipeline__card-interest">{lead.interestLabel}</p>
      ) : null}

      <p className="ea-owner-pipeline__card-preview">{lead.messagePreview}</p>

      <div className="ea-owner-pipeline__card-meta">
        <time dateTime={lead.createdAtLabel}>{lead.createdAtLabel}</time>
        <a href={phoneHref} className="ea-owner-pipeline__card-contact">
          Ara
        </a>
      </div>

      <div className="ea-owner-pipeline__card-controls">
        <label className="ea-owner-pipeline__status-label" htmlFor={selectId}>
          Durum
        </label>
        <select
          id={selectId}
          className="ea-owner-pipeline__status-select"
          value={current}
          onChange={handleSelectChange}
          aria-label={`${lead.parentName} durumu`}
        >
          {OWNER_PIPELINE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {getPipelineStatusLabel(status)}
            </option>
          ))}
        </select>
      </div>

      <details className="ea-owner-pipeline__fallback">
        <summary>Düğmelerle taşı</summary>
        <fieldset className="ea-owner-pipeline__actions">
          <legend className="ea-sr-only">Durum güncelle</legend>
          {OWNER_PIPELINE_STATUSES.map((status) => (
            <form
              key={status}
              action={action}
              onSubmit={() => {
                onSaveScroll();
              }}
            >
              <input type="hidden" name="leadId" value={lead.id} />
              <input type="hidden" name="status" value={status} />
              <StatusSubmitButton
                label={getPipelineStatusLabel(status)}
                current={status === current}
              />
            </form>
          ))}
        </fieldset>
      </details>
    </article>
  );
}
