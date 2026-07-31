import { cn } from "../lib/cn";
import type { ContainerToken } from "../tokens/containers";

export type ContainerClassNameOptions = {
  size?: ContainerToken;
  className?: string;
};

export function getContainerClassName({
  size = "lg",
  className,
}: ContainerClassNameOptions = {}): string {
  return cn("ea-container", `ea-container--${size}`, className);
}
