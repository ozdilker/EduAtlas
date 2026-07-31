import { forwardRef, type HTMLAttributes } from "react";
import { type BadgeTone, getBadgeClassName } from "./badge-classes";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { tone = "neutral", className, ...props },
  ref,
) {
  return <span ref={ref} className={getBadgeClassName({ tone, className })} {...props} />;
});
