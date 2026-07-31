import { cn } from "../lib/cn";

export type InputClassNameOptions = {
  error?: boolean;
  className?: string;
};

export function getInputClassName({
  error = false,
  className,
}: InputClassNameOptions = {}): string {
  return cn("ea-input", error && "ea-input--error", className);
}
