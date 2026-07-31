import { Container } from "../components/container";
import { cn } from "../lib/cn";
import { getHomeTrustBar } from "./home-content";

export type HomeTrustBarProps = {
  className?: string;
};

/**
 * Concept-board statistics strip beneath the hero.
 */
export function HomeTrustBar({ className }: HomeTrustBarProps) {
  const items = getHomeTrustBar();

  return (
    <section className={cn("ea-home-trust-bar", className)} aria-label="EduAtlas göstergeleri">
      <Container size="xl">
        <ul className="ea-home-trust-bar__list">
          {items.map((item) => (
            <li key={item.id} className="ea-home-trust-bar__item">
              <span className="ea-home-trust-bar__icon" aria-hidden="true" />
              <div>
                <p className="ea-home-trust-bar__value">{item.value}</p>
                <p className="ea-home-trust-bar__label">{item.label}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
