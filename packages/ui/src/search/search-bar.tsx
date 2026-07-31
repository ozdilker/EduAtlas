"use client";

import { type FormEvent, type ReactNode, useId, useRef, useState } from "react";
import { SearchButton } from "./search-button";
import { getSearchBarClassName, type SearchBarVariant } from "./search-classes";
import { SearchInput } from "./search-input";

export type SearchBarProps = {
  variant?: SearchBarVariant;
  placeholder?: string;
  defaultQuery?: string;
  query?: string;
  loading?: boolean;
  error?: boolean;
  className?: string;
  filtersSlot?: ReactNode;
  /** Native form action for progressive GET navigation (e.g. `/search`). */
  action?: string;
  method?: "get" | "post";
  inputName?: string;
  inputProps?: {
    "aria-controls"?: string;
    "aria-expanded"?: boolean;
    "aria-activedescendant"?: string;
    "aria-autocomplete"?: "list" | "none";
  };
  onQueryChange?: (query: string) => void;
  onSubmitQuery?: (query: string) => void;
};

/**
 * Composite search entry — composes input + button; no search/API logic.
 */
export function SearchBar({
  variant = "page",
  placeholder = "Kurum, şehir veya tür ara",
  defaultQuery = "",
  query,
  loading = false,
  error = false,
  className,
  filtersSlot,
  action,
  method = "get",
  inputName = "q",
  inputProps,
  onQueryChange,
  onSubmitQuery,
}: SearchBarProps) {
  const formId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const isControlled = query !== undefined;
  const [uncontrolledQuery, setUncontrolledQuery] = useState(defaultQuery);
  const currentQuery = isControlled ? query : uncontrolledQuery;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (onSubmitQuery) {
      event.preventDefault();
      onSubmitQuery(currentQuery.trim());
    }
  }

  return (
    <search className={getSearchBarClassName({ variant, className })} aria-label="Kurum arama">
      <form
        id={formId}
        className="ea-search-bar__form"
        action={action}
        method={method}
        onSubmit={handleSubmit}
      >
        <div className="ea-search-bar__controls">
          <SearchInput
            ref={inputRef}
            id={`${formId}-input`}
            name={inputName}
            placeholder={placeholder}
            value={currentQuery}
            error={error}
            disabled={loading}
            aria-controls={inputProps?.["aria-controls"]}
            aria-expanded={inputProps?.["aria-expanded"]}
            aria-activedescendant={inputProps?.["aria-activedescendant"]}
            aria-autocomplete={inputProps?.["aria-autocomplete"] ?? "list"}
            onChange={(event) => {
              const next = event.target.value;
              if (!isControlled) {
                setUncontrolledQuery(next);
              }
              onQueryChange?.(next);
            }}
            onClear={() => {
              if (!isControlled) {
                setUncontrolledQuery("");
              }
              onQueryChange?.("");
              inputRef.current?.focus();
            }}
          />
          <SearchButton loading={loading} />
        </div>
        {filtersSlot ? <div className="ea-search-bar__filters">{filtersSlot}</div> : null}
      </form>
    </search>
  );
}
