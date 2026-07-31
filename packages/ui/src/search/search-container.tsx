"use client";

import { type ReactNode, useId, useState } from "react";
import { cn } from "../lib/cn";
import { SearchBar, type SearchBarProps } from "./search-bar";
import { getSearchContainerClassName, getSearchStatusClassName } from "./search-classes";
import {
  getSearchStatusMessage,
  getStaticSearchSuggestions,
  type SearchStatus,
  type SearchSuggestionItem,
} from "./search-content";
import { SearchFilters } from "./search-filters";
import { SearchSuggestions } from "./search-suggestions";

export type SearchContainerProps = {
  status?: SearchStatus;
  showSuggestions?: boolean;
  showFilters?: boolean;
  suggestions?: SearchSuggestionItem[];
  searchBarProps?: Omit<
    SearchBarProps,
    "filtersSlot" | "inputProps" | "query" | "onQueryChange"
  > & {
    query?: string;
    onQueryChange?: (query: string) => void;
  };
  children?: ReactNode;
  className?: string;
};

/**
 * Search UI shell with visual loading / empty / error states.
 * Local expand/collapse only — no API, Firebase, or filtering logic.
 */
export function SearchContainer({
  status = "idle",
  showSuggestions = true,
  showFilters = true,
  suggestions = getStaticSearchSuggestions(),
  searchBarProps,
  children,
  className,
}: SearchContainerProps) {
  const statusId = useId();
  const suggestionsId = useId();
  const isQueryControlled = searchBarProps?.query !== undefined;
  const [localQuery, setLocalQuery] = useState(searchBarProps?.defaultQuery ?? "");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(null);
  const statusMessage = getSearchStatusMessage(status);
  const isBusy = status === "loading" || Boolean(searchBarProps?.loading);
  const query = isQueryControlled ? (searchBarProps?.query ?? "") : localQuery;

  function handleQueryChange(next: string) {
    if (!isQueryControlled) {
      setLocalQuery(next);
    }
    setSuggestionsOpen(next.trim().length > 0 && status === "idle");
    searchBarProps?.onQueryChange?.(next);
  }

  return (
    <div
      className={getSearchContainerClassName({ status, className })}
      data-status={status}
      aria-busy={isBusy || undefined}
    >
      <SearchBar
        {...searchBarProps}
        query={query}
        loading={isBusy}
        error={status === "error" || searchBarProps?.error}
        filtersSlot={showFilters ? <SearchFilters /> : undefined}
        inputProps={{
          "aria-controls": showSuggestions ? suggestionsId : undefined,
          "aria-expanded": showSuggestions ? suggestionsOpen : undefined,
          "aria-activedescendant": activeSuggestionId ?? undefined,
          "aria-autocomplete": "list",
        }}
        onQueryChange={handleQueryChange}
      />

      {showSuggestions ? (
        <SearchSuggestions
          id={suggestionsId}
          items={suggestions}
          open={suggestionsOpen && status === "idle"}
          onActiveIdChange={setActiveSuggestionId}
          onClose={() => setSuggestionsOpen(false)}
          onSelect={(item) => {
            handleQueryChange(item.label);
            setSuggestionsOpen(false);
          }}
        />
      ) : null}

      {statusMessage && status !== "idle" ? (
        <div
          id={statusId}
          className={getSearchStatusClassName({ status })}
          role="status"
          aria-live={status === "error" ? "assertive" : "polite"}
        >
          {status === "loading" ? (
            <span className="ea-search-status__spinner" aria-hidden="true" />
          ) : null}
          <p className="ea-search-status__message">{statusMessage}</p>
        </div>
      ) : null}

      {children ? (
        <div
          className={cn("ea-search-container__results")}
          aria-describedby={statusMessage ? statusId : undefined}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
