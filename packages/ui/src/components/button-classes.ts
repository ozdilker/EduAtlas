import { cn } from "../lib/cn";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "destructive" | "link";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonClassNameOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

export function getButtonClassName({
  variant = "primary",
  size = "md",
  className,
}: ButtonClassNameOptions = {}): string {
  return cn("ea-button", `ea-button--${variant}`, `ea-button--${size}`, className);
}
