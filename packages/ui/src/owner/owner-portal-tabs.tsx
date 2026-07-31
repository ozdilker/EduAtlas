"use client";

import { type KeyboardEvent, useRef } from "react";
import { cn } from "../lib/cn";

export type OwnerPortalTabId =
  | "overview"
  | "leads"
  | "insights"
  | "profile"
  | "onboarding";

export type OwnerPortalTabsProps = {
  activeTab: OwnerPortalTabId;
  className?: string;
  /** Called when a tab link is activated (e.g. close mobile menu). */
  onNavigate?: () => void;
};

const TABS: readonly { id: OwnerPortalTabId; label: string; href: string }[] = [
  { id: "onboarding", label: "Kurulum", href: "/owner/onboarding" },
  { id: "overview", label: "Özet", href: "/owner" },
  { id: "leads", label: "Talepler", href: "/owner/leads" },
  { id: "insights", label: "İçgörüler", href: "/owner/insights" },
  { id: "profile", label: "Profil", href: "/owner/profile" },
] as const;

/**
 * Owner dashboard section tabs — URL-backed so refresh preserves state.
 */
export function OwnerPortalTabs({ activeTab, className, onNavigate }: OwnerPortalTabsProps) {
  const tabRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  function focusTab(index: number) {
    const next = tabRefs.current[index];
    next?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const currentIndex = TABS.findIndex((tab) => tab.id === activeTab);
    if (currentIndex < 0) {
      return;
    }

    let nextIndex = currentIndex;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      nextIndex = (currentIndex + 1) % TABS.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
    } else if (event.key === "Home") {
      event.preventDefault();
      nextIndex = 0;
    } else if (event.key === "End") {
      event.preventDefault();
      nextIndex = TABS.length - 1;
    } else {
      return;
    }

    focusTab(nextIndex);
    tabRefs.current[nextIndex]?.click();
  }

  return (
    <div
      className={cn("ea-owner-portal-tabs", className)}
      role="tablist"
      aria-label="Panel bölümleri"
      onKeyDown={handleKeyDown}
    >
      {TABS.map((tab, index) => {
        const selected = tab.id === activeTab;
        return (
          <a
            key={tab.id}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            href={tab.href}
            role="tab"
            id={`owner-tab-${tab.id}`}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            className={cn(
              "ea-owner-portal-tabs__tab",
              selected && "ea-owner-portal-tabs__tab--active",
            )}
            onClick={() => onNavigate?.()}
          >
            <span>{tab.label}</span>
          </a>
        );
      })}
    </div>
  );
}
