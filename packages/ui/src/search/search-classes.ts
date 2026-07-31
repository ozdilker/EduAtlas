import { cn } from "../lib/cn";

export type SearchBarVariant = "hero" | "header" | "page";

export type SearchBarClassNameOptions = {
  variant?: SearchBarVariant;
  className?: string;
};

export function getSearchBarClassName({
  variant = "page",
  className,
}: SearchBarClassNameOptions = {}): string {
  return cn("ea-search-bar", `ea-search-bar--${variant}`, className);
}

export type SearchContainerClassNameOptions = {
  status?: "idle" | "loading" | "empty" | "error";
  className?: string;
};

export function getSearchContainerClassName({
  status = "idle",
  className,
}: SearchContainerClassNameOptions = {}): string {
  return cn(
    "ea-search-container",
    status !== "idle" && `ea-search-container--${status}`,
    className,
  );
}

export type SearchStatusClassNameOptions = {
  status: "loading" | "empty" | "error";
  className?: string;
};

export function getSearchStatusClassName({
  status,
  className,
}: SearchStatusClassNameOptions): string {
  return cn("ea-search-status", `ea-search-status--${status}`, className);
}
