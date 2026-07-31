"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";
import { Button } from "../components/button";
import type { ButtonSize, ButtonVariant } from "../components/button-classes";
import { cn } from "../lib/cn";

export type SearchButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingLabel?: string;
};

/**
 * Search submit control — visual loading only; no search logic.
 */
export const SearchButton = forwardRef<HTMLButtonElement, SearchButtonProps>(function SearchButton(
  {
    children = "Ara",
    variant = "primary",
    size = "md",
    loading = false,
    loadingLabel = "Aranıyor…",
    className,
    disabled,
    type = "submit",
    ...props
  },
  ref,
) {
  return (
    <Button
      ref={ref}
      type={type}
      variant={variant}
      size={size}
      className={cn("ea-search-button", loading && "ea-search-button--loading", className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? loadingLabel : children}
    </Button>
  );
});
