import { Badge } from "../components/badge";
import { Container } from "../components/container";
import { cn } from "../lib/cn";
import { getHomeTrustIndicators } from "./home-content";

export type HomeTrustProps = {
  className?: string;
};

/**
 * Why EduAtlas — trust storytelling for families and institutions.
 */
export function HomeTrust({ className }: HomeTrustProps) {
  const items = getHomeTrustIndicators();

  return (
    <section className={cn("ea-home-trust", className)} aria-labelledby="home-trust-heading">
      <Container size="xl">
        <header className="ea-home-section-header">
          <p className="ea-marketing-eyebrow">Güven</p>
          <h2 id="home-trust-heading" className="ea-home-section-title">
            Neden EduAtlas?
          </h2>
          <p className="ea-home-section-lede">
            Ailelere sakin karar desteği; kurumlara görünürlük ve daha iyi öğrenci erişimi.
          </p>
        </header>
        <ul className="ea-home-trust__list">
          {items.map((item) => (
            <li key={item.id} className="ea-home-trust__item">
              <Badge tone="success">{item.label}</Badge>
              <p className="ea-home-trust__description">{item.description}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
