import { forwardRef, type HTMLAttributes } from "react";
import { type CardPadding, getCardClassName } from "./card-classes";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
  padding?: CardPadding;
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { interactive = false, padding = "default", className, ...props },
  ref,
) {
  return (
    <div ref={ref} className={getCardClassName({ interactive, padding, className })} {...props} />
  );
});
