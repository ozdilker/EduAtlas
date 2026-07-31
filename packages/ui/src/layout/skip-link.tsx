import { cn } from "../lib/cn";

export type SkipLinkProps = {
  href?: string;
  label?: string;
  className?: string;
};

/**
 * Skip navigation control for keyboard and screen-reader users.
 */
export function SkipLink({
  href = "#main-content",
  label = "İçeriğe atla",
  className,
}: SkipLinkProps) {
  return (
    <a href={href} className={cn("ea-skip-link", className)}>
      {label}
    </a>
  );
}
