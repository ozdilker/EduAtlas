"use client";

import { type KeyboardEvent, useCallback, useEffect, useId, useRef, useState } from "react";
import { Container } from "../components/container";
import { cn } from "../lib/cn";
import { OwnerLeadDetail } from "./owner-lead-detail";
import { OwnerLeadDrawer } from "./owner-lead-drawer";
import { OwnerLeadList } from "./owner-lead-list";
import { OwnerLeadPipelineBoard } from "./owner-lead-pipeline-board";
import type { OwnerLeadsWorkspaceView, OwnerLeadsWorkspaceViewData } from "./owner-portal-content";
import { restoreOwnerPortalScroll, saveOwnerPortalScroll } from "./owner-portal-scroll";
import { OwnerPortalShell } from "./owner-portal-shell";

export type OwnerLeadsWorkspaceProps = {
  data: OwnerLeadsWorkspaceViewData;
  action: (formData: FormData) => Promise<void> | void;
  initialView?: OwnerLeadsWorkspaceView;
  initialLeadId?: string;
  className?: string;
};

type DrawerHistoryState = {
  eaOwnerLeadDrawer?: boolean;
  eaOwnerLeadId?: string;
  eaOwnerLeadsView?: OwnerLeadsWorkspaceView;
};

function readViewFromUrl(): OwnerLeadsWorkspaceView {
  if (typeof window === "undefined") {
    return "list";
  }
  const value = new URL(window.location.href).searchParams.get("view");
  return value === "pipeline" ? "pipeline" : "list";
}

function readLeadFromUrl(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return new URL(window.location.href).searchParams.get("lead");
}

function buildLeadsUrl(view: OwnerLeadsWorkspaceView, leadId: string | null): string {
  const url = new URL("/owner/leads", window.location.origin);
  if (view === "pipeline") {
    url.searchParams.set("view", "pipeline");
  }
  if (leadId) {
    url.searchParams.set("lead", leadId);
  }
  return `${url.pathname}${url.search}`;
}

/**
 * Single Talepler workspace — Liste + Pipeline tabs, client lead drawer.
 */
export function OwnerLeadsWorkspace({
  data,
  action,
  initialView = "list",
  initialLeadId,
  className,
}: OwnerLeadsWorkspaceProps) {
  const listTabId = useId();
  const pipelineTabId = useId();
  const listPanelId = useId();
  const pipelinePanelId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const drawerPushedRef = useRef(false);

  const [view, setView] = useState<OwnerLeadsWorkspaceView>(initialView);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(initialLeadId ?? null);

  const selectedLead = selectedLeadId ? (data.leadDetailsById[selectedLeadId] ?? null) : null;

  const syncUrl = useCallback((nextView: OwnerLeadsWorkspaceView, leadId: string | null) => {
    const href = buildLeadsUrl(nextView, leadId);
    const state: DrawerHistoryState = {
      eaOwnerLeadsView: nextView,
      ...(leadId
        ? { eaOwnerLeadDrawer: true, eaOwnerLeadId: leadId }
        : { eaOwnerLeadDrawer: false }),
    };
    window.history.replaceState(state, "", href);
  }, []);

  const openLead = useCallback(
    (leadId: string) => {
      if (!data.leadDetailsById[leadId]) {
        window.location.assign(`/owner/leads/${leadId}`);
        return;
      }

      saveOwnerPortalScroll();

      if (!selectedLeadId) {
        const state: DrawerHistoryState = {
          eaOwnerLeadDrawer: true,
          eaOwnerLeadId: leadId,
          eaOwnerLeadsView: view,
        };
        window.history.pushState(state, "", buildLeadsUrl(view, leadId));
        drawerPushedRef.current = true;
      } else {
        syncUrl(view, leadId);
      }
      setSelectedLeadId(leadId);
    },
    [data.leadDetailsById, selectedLeadId, syncUrl, view],
  );

  const closeLead = useCallback(
    (options?: { fromPopState?: boolean }) => {
      setSelectedLeadId(null);
      requestAnimationFrame(() => {
        restoreOwnerPortalScroll({ clear: true });
      });

      if (options?.fromPopState) {
        drawerPushedRef.current = false;
        syncUrl(view, null);
        return;
      }

      const state = window.history.state as DrawerHistoryState | null;
      if (drawerPushedRef.current && state?.eaOwnerLeadDrawer) {
        drawerPushedRef.current = false;
        window.history.back();
        return;
      }

      syncUrl(view, null);
    },
    [syncUrl, view],
  );

  const selectView = useCallback(
    (next: OwnerLeadsWorkspaceView) => {
      setView(next);
      const leadId = selectedLeadId;
      const state: DrawerHistoryState = {
        eaOwnerLeadsView: next,
        ...(leadId
          ? { eaOwnerLeadDrawer: true, eaOwnerLeadId: leadId }
          : { eaOwnerLeadDrawer: false }),
      };
      window.history.replaceState(state, "", buildLeadsUrl(next, leadId));
    },
    [selectedLeadId],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only URL hydration
  useEffect(() => {
    const urlView = readViewFromUrl();
    const urlLead = readLeadFromUrl();
    if (urlView !== view) {
      setView(urlView);
    }
    if (urlLead && urlLead !== selectedLeadId && data.leadDetailsById[urlLead]) {
      setSelectedLeadId(urlLead);
      const state = window.history.state as DrawerHistoryState | null;
      drawerPushedRef.current = Boolean(state?.eaOwnerLeadDrawer);
    }
  }, []);

  useEffect(() => {
    function handlePopState(event: PopStateEvent) {
      const state = (event.state ?? {}) as DrawerHistoryState;
      if (state.eaOwnerLeadsView === "list" || state.eaOwnerLeadsView === "pipeline") {
        setView(state.eaOwnerLeadsView);
      } else {
        setView(readViewFromUrl());
      }

      if (state.eaOwnerLeadDrawer && state.eaOwnerLeadId) {
        setSelectedLeadId(state.eaOwnerLeadId);
        drawerPushedRef.current = true;
        return;
      }

      const urlLead = readLeadFromUrl();
      if (urlLead && data.leadDetailsById[urlLead]) {
        setSelectedLeadId(urlLead);
        return;
      }

      setSelectedLeadId(null);
      drawerPushedRef.current = false;
      requestAnimationFrame(() => {
        restoreOwnerPortalScroll({ clear: true });
      });
    }

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [data.leadDetailsById]);

  function handleTabKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const order: OwnerLeadsWorkspaceView[] = ["list", "pipeline"];
    const currentIndex = order.indexOf(view);
    let nextIndex = currentIndex;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      nextIndex = (currentIndex + 1) % order.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      nextIndex = (currentIndex - 1 + order.length) % order.length;
    } else if (event.key === "Home") {
      event.preventDefault();
      nextIndex = 0;
    } else if (event.key === "End") {
      event.preventDefault();
      nextIndex = order.length - 1;
    } else {
      return;
    }

    selectView(order[nextIndex] ?? "list");
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <OwnerPortalShell
      institutionName={data.institutionName}
      institutionLogoUrl={data.institutionLogoUrl}
      activeTab="leads"
      className={className}
    >
      <Container size="2xl" className="ea-owner-portal ea-owner-portal--leads-workspace">
        <header className="ea-owner-portal__hero">
          <p className="ea-owner-portal__eyebrow">Kurum paneli</p>
          <h1 className="ea-owner-portal__title">Talepler</h1>
          <p className="ea-owner-portal__description">
            {data.institutionName} için tek talep çalışma alanı — liste ve pipeline birlikte.
          </p>
        </header>

        <div
          className="ea-owner-leads-tabs"
          role="tablist"
          aria-label="Talepler görünümü"
          onKeyDown={handleTabKeyDown}
        >
          <button
            ref={(node) => {
              tabRefs.current[0] = node;
            }}
            type="button"
            role="tab"
            id={listTabId}
            aria-controls={listPanelId}
            aria-selected={view === "list"}
            tabIndex={view === "list" ? 0 : -1}
            className={cn(
              "ea-owner-leads-tabs__tab",
              view === "list" && "ea-owner-leads-tabs__tab--active",
            )}
            onClick={() => selectView("list")}
          >
            Liste
          </button>
          <button
            ref={(node) => {
              tabRefs.current[1] = node;
            }}
            type="button"
            role="tab"
            id={pipelineTabId}
            aria-controls={pipelinePanelId}
            aria-selected={view === "pipeline"}
            tabIndex={view === "pipeline" ? 0 : -1}
            className={cn(
              "ea-owner-leads-tabs__tab",
              view === "pipeline" && "ea-owner-leads-tabs__tab--active",
            )}
            onClick={() => selectView("pipeline")}
          >
            Pipeline
          </button>
        </div>

        <div
          id={listPanelId}
          role="tabpanel"
          aria-labelledby={listTabId}
          hidden={view !== "list"}
          className="ea-owner-leads-workspace__panel"
        >
          <div className="ea-owner-leads-workspace__lists">
            <section
              className="ea-owner-leads-workspace__list-col"
              aria-labelledby="owner-new-leads-heading"
            >
              <h2 id="owner-new-leads-heading" className="ea-owner-portal__section-title">
                Yeni Talepler
              </h2>
              <OwnerLeadList
                leads={data.pendingLeads}
                selectedLeadId={selectedLeadId ?? undefined}
                emptyMessage="Yeni talep yok."
                onSelectLead={openLead}
              />
            </section>

            <section
              className="ea-owner-leads-workspace__list-col"
              aria-labelledby="owner-recent-leads-heading"
            >
              <h2 id="owner-recent-leads-heading" className="ea-owner-portal__section-title">
                Son talepler
              </h2>
              <OwnerLeadList
                leads={data.recentLeads}
                selectedLeadId={selectedLeadId ?? undefined}
                emptyMessage="Henüz bilgi talebi yok."
                onSelectLead={openLead}
              />
            </section>
          </div>
        </div>

        <div
          id={pipelinePanelId}
          role="tabpanel"
          aria-labelledby={pipelineTabId}
          hidden={view !== "pipeline"}
          className="ea-owner-leads-workspace__panel"
        >
          <OwnerLeadPipelineBoard
            data={data.pipeline}
            action={action}
            embedded
            onOpenLead={openLead}
            selectedLeadId={selectedLeadId ?? undefined}
          />
        </div>
      </Container>

      <OwnerLeadDrawer open={Boolean(selectedLead)} onClose={() => closeLead()}>
        {selectedLead ? <OwnerLeadDetail lead={selectedLead} /> : null}
      </OwnerLeadDrawer>
    </OwnerPortalShell>
  );
}
