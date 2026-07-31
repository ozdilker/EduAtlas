"use client";

import { useId, useState } from "react";
import { cn } from "../lib/cn";
import { getSearchFilterPlaceholders, type SearchFilterPlaceholder } from "./search-content";

export type SearchFiltersProps = {
  filters?: SearchFilterPlaceholder[];
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

/**
 * Collapsed filter placeholder — expand/collapse UI only; no filtering logic.
 */
export function SearchFilters({
  filters = getSearchFilterPlaceholders(),
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  className,
}: SearchFiltersProps) {
  const panelId = useId();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;

  function setOpen(next: boolean) {
    if (!isControlled) {
      setUncontrolledOpen(next);
    }
    onOpenChange?.(next);
  }

  return (
    <div className={cn("ea-search-filters", open && "ea-search-filters--open", className)}>
      <button
        type="button"
        className="ea-search-filters__toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
      >
        Filtreler
        <span className="ea-search-filters__hint" aria-hidden="true">
          {open ? "−" : "+"}
        </span>
      </button>

      <fieldset id={panelId} className="ea-search-filters__panel" hidden={!open}>
        <legend className="ea-sr-only">Arama filtreleri (yakında)</legend>
        <p className="ea-search-filters__placeholder">
          Filtreler yakında etkinleşecek. Bu alan yalnızca arayüz yer tutucusudur.
        </p>
        <ul className="ea-search-filters__list">
          {filters.map((filter) => (
            <li key={filter.id} className="ea-search-filters__item">
              <label className="ea-search-filters__label" htmlFor={`${panelId}-${filter.id}`}>
                {filter.label}
              </label>
              <select
                id={`${panelId}-${filter.id}`}
                className="ea-search-filters__control"
                disabled
                defaultValue=""
              >
                <option value="" disabled>
                  {filter.placeholder}
                </option>
              </select>
            </li>
          ))}
        </ul>
      </fieldset>
    </div>
  );
}
