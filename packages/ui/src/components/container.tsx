import { createElement, type ElementType, forwardRef, type HTMLAttributes } from "react";
import type { ContainerToken } from "../tokens/containers";
import { getContainerClassName } from "./container-classes";

export type ContainerProps = HTMLAttributes<HTMLElement> & {
  size?: ContainerToken;
  as?: ElementType;
};

export const Container = forwardRef<HTMLElement, ContainerProps>(function Container(
  { size = "lg", as = "div", className, ...props },
  ref,
) {
  return createElement(as, {
    ref,
    className: getContainerClassName({ size, className }),
    ...props,
  });
});
