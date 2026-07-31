import { Container } from "../components/container";
import { cn } from "../lib/cn";
import { getHomeStatistics } from "./home-content";

export type HomeStatisticsProps = {
  className?: string;
};

/**
 * Homepage statistics presentation — static UI figures only.
 */
export function HomeStatistics({ className }: HomeStatisticsProps) {
  const stats = getHomeStatistics();

  return (
    <section className={cn("ea-home-stats", className)} aria-labelledby="home-stats-heading">
      <Container size="lg">
        <h2 id="home-stats-heading" className="ea-home-section-title">
          EduAtlas’a bakış
        </h2>
        <ul className="ea-home-stats__list">
          {stats.map((stat) => (
            <li key={stat.id} className="ea-home-stats__item">
              <p className="ea-home-stats__value">{stat.value}</p>
              <p className="ea-home-stats__label">{stat.label}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
