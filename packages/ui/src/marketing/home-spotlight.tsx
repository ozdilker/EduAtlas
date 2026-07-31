import { getButtonClassName } from "../components/button-classes";
import { Container } from "../components/container";
import { InstitutionCard } from "../institution/institution-card";
import { cn } from "../lib/cn";
import { getStaticSearchRecommendations } from "../search-results/search-results-content";

export type HomeSpotlightProps = {
  className?: string;
};

/**
 * Concept-board featured strip: red mission card + recommendations list.
 */
export function HomeSpotlight({ className }: HomeSpotlightProps) {
  const recommendations = getStaticSearchRecommendations().slice(0, 3);

  return (
    <section
      className={cn("ea-home-spotlight", className)}
      aria-labelledby="home-spotlight-heading"
    >
      <Container size="xl" className="ea-home-spotlight__inner">
        <div className="ea-home-spotlight__banner">
          <p className="ea-home-spotlight__eyebrow">Keşif</p>
          <h2 id="home-spotlight-heading" className="ea-home-spotlight__title">
            Doğru eğitim, doğru geleceği başlatır
          </h2>
          <p className="ea-home-spotlight__copy">
            Türkiye’nin eğitim kurumlarını tek yerden keşfedin; aileniz için en uygun seçeneğe
            güvenle ilerleyin.
          </p>
          <a
            href="/search"
            className={cn(
              getButtonClassName({ variant: "secondary", size: "lg" }),
              "ea-home-spotlight__cta",
            )}
          >
            Hemen Keşfet
          </a>
        </div>

        <div className="ea-home-spotlight__recs">
          <header className="ea-home-spotlight__recs-header">
            <h3 className="ea-home-spotlight__recs-title">Size özel öneriler</h3>
            <p className="ea-home-spotlight__recs-copy">
              Güven işaretlerine göre öne çıkan örnekler — statik sunum.
            </p>
          </header>
          <ul className="ea-home-spotlight__recs-list">
            {recommendations.map((institution) => (
              <li key={institution.id}>
                <InstitutionCard
                  data={institution}
                  layout="compact"
                  actions={{ showFavorite: true, showCta: true }}
                />
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
