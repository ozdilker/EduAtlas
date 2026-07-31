import { cn } from "../lib/cn";
import type { InstitutionCardLayout } from "./institution-card-content";

export type InstitutionCardClassNameOptions = {
  layout?: InstitutionCardLayout;
  className?: string;
};

export function getInstitutionCardClassName({
  layout = "vertical",
  className,
}: InstitutionCardClassNameOptions = {}): string {
  return cn("ea-institution-card", `ea-institution-card--${layout}`, className);
}

export function getInstitutionCardSkeletonClassName(className?: string): string {
  return cn("ea-institution-card", "ea-institution-card--skeleton", className);
}

export function getInstitutionCardEmptyClassName(className?: string): string {
  return cn("ea-institution-card", "ea-institution-card--empty", className);
}
