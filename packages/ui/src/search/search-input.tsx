"use client";

import {
  type ChangeEvent,
  forwardRef,
  type InputHTMLAttributes,
  type KeyboardEvent,
  useId,
  useState,
} from "react";
import { Input } from "../components/input";
import { cn } from "../lib/cn";

export type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value"> & {
  label?: string;
  clearLabel?: string;
  showClear?: boolean;
  error?: boolean;
  value?: string;
  onClear?: () => void;
};

/**
 * Reusable search text field — UI only; no query/search logic.
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  {
    id,
    label = "Kurum, şehir veya tür ara",
    clearLabel = "Aramayı temizle",
    showClear = true,
    error = false,
    value,
    defaultValue,
    className,
    onChange,
    onClear,
    onKeyDown,
    disabled,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(() =>
    typeof defaultValue === "string" ? defaultValue : "",
  );
  const currentValue = isControlled ? value : uncontrolledValue;
  const canClear = showClear && currentValue.length > 0 && !disabled;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (!isControlled) {
      setUncontrolledValue(event.target.value);
    }
    onChange?.(event);
  }

  function handleClear() {
    if (!isControlled) {
      setUncontrolledValue("");
    }
    onClear?.();
    queueMicrotask(() => {
      document.getElementById(inputId)?.focus();
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);
  }

  return (
    <div className={cn("ea-search-input", error && "ea-search-input--error", className)}>
      <label className="ea-sr-only" htmlFor={inputId}>
        {label}
      </label>
      <Input
        ref={ref}
        id={inputId}
        type="search"
        autoComplete="off"
        spellCheck={false}
        {...props}
        name={props.name ?? "q"}
        value={currentValue}
        error={error}
        disabled={disabled}
        aria-invalid={error || undefined}
        className="ea-search-input__field"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      {canClear ? (
        <button
          type="button"
          className="ea-search-input__clear"
          aria-label={clearLabel}
          onClick={handleClear}
        >
          <span aria-hidden="true">×</span>
        </button>
      ) : null}
    </div>
  );
});
