"use client";

import { type ReactNode, useEffect } from "react";

const PENDING_CLASS = "ea-search-pending";

/**
 * Adds a brief, reversible pending class during native GET search navigations.
 * No filter/URL/search-logic changes — visual transition only.
 */
export type SearchPendingTransitionProps = {
  children: ReactNode;
};

export function SearchPendingTransition({ children }: SearchPendingTransitionProps) {
  useEffect(() => {
    function clearPending() {
      document.documentElement.classList.remove(PENDING_CLASS);
    }

    function handleSubmit(event: Event) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) {
        return;
      }
      const isSearchBar = Boolean(form.closest(".ea-search-bar"));
      const isFilterForm = form.classList.contains("ea-search-results__filter-form");
      if (!isSearchBar && !isFilterForm) {
        return;
      }
      document.documentElement.classList.add(PENDING_CLASS);
    }

    document.addEventListener("submit", handleSubmit, true);
    window.addEventListener("pageshow", clearPending);
    clearPending();

    return () => {
      document.removeEventListener("submit", handleSubmit, true);
      window.removeEventListener("pageshow", clearPending);
      clearPending();
    };
  }, []);

  return children;
}
