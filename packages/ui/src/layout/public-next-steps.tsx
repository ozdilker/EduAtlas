import { getButtonClassName } from "../components/button-classes";
import type { NavItem } from "../layout/navigation";
import { cn } from "../lib/cn";

export type PublicNextStepsProps = {
  title?: string;
  links: NavItem[];
  className?: string;
};

/**
 * Consistent “next step” link row for public pages.
 */
export function PublicNextSteps({
  title = "Sonraki adımlar",
  links,
  className,
}: PublicNextStepsProps) {
  if (links.length === 0) {
    return null;
  }

  return (
    <nav className={cn("ea-next-steps", className)} aria-labelledby="public-next-steps-heading">
      <h2 id="public-next-steps-heading" className="ea-next-steps__title">
        {title}
      </h2>
      <ul className="ea-next-steps__list">
        {links.map((link) => (
          <li key={link.id}>
            <a
              href={link.href}
              className={cn(getButtonClassName({ variant: "secondary", size: "md" }))}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
