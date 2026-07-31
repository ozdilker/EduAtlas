import { Container } from "../components/container";
import { cn } from "../lib/cn";
import { getHomeImpactStats } from "./home-content";

export type HomeImpactProps = {
  className?: string;
};

/**
 * Mission impact banner — emotional reinforcement, static labels only.
 */
export function HomeImpact({ className }: HomeImpactProps) {
  const stats = getHomeImpactStats();

  return (
    <section className={cn("ea-home-impact", className)} aria-labelledby="home-impact-heading">
      <Container size="xl" className="ea-home-impact__inner">
        <div className="ea-home-impact__copy">
          <p className="ea-home-impact__eyebrow">Misyon</p>
          <h2 id="home-impact-heading" className="ea-home-impact__title">
            Eğitimin dijital kapısı
          </h2>
          <p className="ea-home-impact__lede">
            Ailelere güvenli karar; kurumlara daha iyi öğrenci erişimi. EduAtlas, Türkiye’nin eğitim
            ekosistemini bir araya getirir.
          </p>
        </div>
        <ul className="ea-home-impact__stats">
          {stats.map((item) => (
            <li key={item.id} className="ea-home-impact__stat">
              <p className="ea-home-impact__value">{item.value}</p>
              <p className="ea-home-impact__label">{item.label}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
