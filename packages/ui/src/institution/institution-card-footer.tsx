import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export type InstitutionCardFooterProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Card footer region for actions and secondary content.
 */
export function InstitutionCardFooter({ children, className }: InstitutionCardFooterProps) {
  return <footer className={cn("ea-institution-card__footer", className)}>{children}</footer>;
}
