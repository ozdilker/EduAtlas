"use client";

import { type KeyboardEvent, useEffect, useId, useState } from "react";
import { cn } from "../lib/cn";
import { getStaticSearchSuggestions, type SearchSuggestionItem } from "./search-content";

export type SearchSuggestionsProps = {
  id?: string;
  items?: SearchSuggestionItem[];
  open?: boolean;
  labelledBy?: string;
  className?: string;
  onActiveIdChange?: (id: string | null) => void;
  onSelect?: (item: SearchSuggestionItem) => void;
  onClose?: () => void;
};

/**
 * Static suggestion list — presentation and keyboard highlight only.
 */
export function SearchSuggestions({
  id,
  items = getStaticSearchSuggestions(),
  open = true,
  labelledBy,
  className,
  onActiveIdChange,
  onSelect,
  onClose,
}: SearchSuggestionsProps) {
  const generatedId = useId();
  const listboxId = id ?? generatedId;
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      onActiveIdChange?.(null);
      return;
    }
    const active = items[activeIndex];
    onActiveIdChange?.(active ? `${listboxId}-option-${active.id}` : null);
  }, [activeIndex, items, listboxId, onActiveIdChange, open]);

  if (!open || items.length === 0) {
    return null;
  }

  function moveActive(nextIndex: number) {
    const bounded = Math.max(0, Math.min(items.length - 1, nextIndex));
    setActiveIndex(bounded);
  }

  function handleListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveActive(activeIndex + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        moveActive(activeIndex - 1);
        break;
      case "Home":
        event.preventDefault();
        moveActive(0);
        break;
      case "End":
        event.preventDefault();
        moveActive(items.length - 1);
        break;
      case "Enter": {
        event.preventDefault();
        const item = items[activeIndex];
        if (item) {
          onSelect?.(item);
        }
        break;
      }
      case "Escape":
        event.preventDefault();
        onClose?.();
        break;
      default:
        break;
    }
  }

  const activeOption = items[activeIndex];
  const activeId = activeOption ? `${listboxId}-option-${activeOption.id}` : undefined;

  return (
    <div className={cn("ea-search-suggestions", className)}>
      <div
        id={listboxId}
        className="ea-search-suggestions__list"
        role="listbox"
        tabIndex={0}
        aria-label={labelledBy ? undefined : "Arama önerileri"}
        aria-labelledby={labelledBy}
        aria-activedescendant={activeId}
        onKeyDown={handleListKeyDown}
      >
        {items.map((item, index) => {
          const optionId = `${listboxId}-option-${item.id}`;
          const selected = index === activeIndex;

          return (
            <div
              key={item.id}
              id={optionId}
              role="option"
              tabIndex={-1}
              aria-selected={selected}
              className={cn(
                "ea-search-suggestions__option",
                selected && "ea-search-suggestions__option--active",
              )}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => onSelect?.(item)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect?.(item);
                }
              }}
            >
              <span className="ea-search-suggestions__label">{item.label}</span>
              {item.description ? (
                <span className="ea-search-suggestions__description">{item.description}</span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
