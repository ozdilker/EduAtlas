"use client";

import type { MouseEvent } from "react";
import { Badge } from "../components/badge";
import { cn } from "../lib/cn";
import type { OwnerLeadListItemView } from "./owner-portal-content";
import { saveOwnerPortalScroll } from "./owner-portal-scroll";

export type OwnerLeadListProps = {
  leads: readonly OwnerLeadListItemView[];
  selectedLeadId?: string;
  emptyMessage?: string;
  className?: string;
  /** Soft-open handler — when set, navigates without a full page reload. */
  onSelectLead?: (leadId: string) => void;
};

/**
 * Read-only recent leads list for the owner portal.
 */
export function OwnerLeadList({
  leads,
  selectedLeadId,
  emptyMessage = "Henüz bilgi talebi yok.",
  className,
  onSelectLead,
}: OwnerLeadListProps) {
  if (leads.length === 0) {
    return (
      <div className={cn("ea-owner-leads-empty", className)} role="status">
        <span className="ea-owner-leads-empty__mark" aria-hidden="true" />
        <p className="ea-owner-leads-empty__message">{emptyMessage}</p>
      </div>
    );
  }

  function handleClick(event: MouseEvent<HTMLAnchorElement>, leadId: string) {
    if (!onSelectLead || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      saveOwnerPortalScroll();
      return;
    }
    event.preventDefault();
    onSelectLead(leadId);
  }

  return (
    <ul className={cn("ea-owner-lead-list", className)}>
      {leads.map((lead) => {
        const selected = lead.id === selectedLeadId;
        const href = onSelectLead ? `/owner/leads?lead=${encodeURIComponent(lead.id)}` : lead.href;
        return (
          <li key={lead.id}>
            <a
              href={href}
              className={cn(
                "ea-owner-lead-list__item",
                selected && "ea-owner-lead-list__item--selected",
              )}
              aria-current={selected ? "true" : undefined}
              onClick={(event) => handleClick(event, lead.id)}
            >
              <div className="ea-owner-lead-list__top">
                <span className="ea-owner-lead-list__name">{lead.parentName}</span>
                <Badge tone={lead.status === "new" ? "info" : "neutral"}>{lead.statusLabel}</Badge>
              </div>
              <p className="ea-owner-lead-list__preview">{lead.messagePreview}</p>
              <div className="ea-owner-lead-list__meta">
                <span>{lead.phone}</span>
                <time dateTime={lead.createdAtLabel}>{lead.createdAtLabel}</time>
              </div>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
