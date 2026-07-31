import { cn } from "../lib/cn";

export type CardPadding = "default" | "comfortable";

export type CardClassNameOptions = {
  interactive?: boolean;
  padding?: CardPadding;
  className?: string;
};

export function getCardClassName({
  interactive = false,
  padding = "default",
  className,
}: CardClassNameOptions = {}): string {
  return cn(
    "ea-card",
    padding === "comfortable" && "ea-card--comfortable",
    interactive && "ea-card--interactive",
    className,
  );
}
