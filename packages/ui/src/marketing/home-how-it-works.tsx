import { Container } from "../components/container";
import { cn } from "../lib/cn";
import { getHomeHowItWorks } from "./home-content";

export type HomeHowItWorksProps = {
  className?: string;
};

/**
 * Three-step guidance for families — presentation only.
 */
export function HomeHowItWorks({ className }: HomeHowItWorksProps) {
  const steps = getHomeHowItWorks();

  return (
    <section className={cn("ea-home-how", className)} aria-labelledby="home-how-heading">
      <Container size="xl">
        <header className="ea-home-section-header">
          <p className="ea-marketing-eyebrow">Rehberlik</p>
          <h2 id="home-how-heading" className="ea-home-section-title">
            Nasıl çalışır?
          </h2>
          <p className="ea-home-section-lede">
            Karar stresini azaltan sakin bir akış: ara, karşılaştır, iletişime geç.
          </p>
        </header>

        <ol className="ea-home-how__list">
          {steps.map((step) => (
            <li key={step.id} className="ea-home-how__item">
              <span className="ea-home-how__step" aria-hidden="true">
                {step.step}
              </span>
              <h3 className="ea-home-how__title">{step.title}</h3>
              <p className="ea-home-how__copy">{step.description}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
