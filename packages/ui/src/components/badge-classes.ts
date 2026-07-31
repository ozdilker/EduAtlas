import { cn } from "../lib/cn";

export type BadgeTone =
  | "neutral"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "info";

export type BadgeClassNameOptions = {
  tone?: BadgeTone;
  className?: string;
};

export function getBadgeClassName({
  tone = "neutral",
  className,
}: BadgeClassNameOptions = {}): string {
  return cn("ea-badge", `ea-badge--${tone}`, className);
}
