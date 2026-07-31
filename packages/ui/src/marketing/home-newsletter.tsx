import { getButtonClassName } from "../components/button-classes";
import { Container } from "../components/container";
import { Input } from "../components/input";
import { cn } from "../lib/cn";

export type HomeNewsletterProps = {
  className?: string;
};

/**
 * Concept-board newsletter bar — visual GET form only (no backend).
 */
export function HomeNewsletter({ className }: HomeNewsletterProps) {
  return (
    <section
      className={cn("ea-home-newsletter", className)}
      aria-labelledby="home-newsletter-heading"
    >
      <Container size="xl" className="ea-home-newsletter__inner">
        <div>
          <h2 id="home-newsletter-heading" className="ea-home-newsletter__title">
            Eğitim gündemini kaçırmayın
          </h2>
          <p className="ea-home-newsletter__copy">
            Şehir hub’ları, rehberler ve yeni kurumlar — e-posta ile sakin güncellemeler.
          </p>
        </div>
        <form className="ea-home-newsletter__form" action="/contact" method="get">
          <label className="ea-sr-only" htmlFor="home-newsletter-email">
            E-posta
          </label>
          <Input
            id="home-newsletter-email"
            name="email"
            type="email"
            placeholder="E-posta adresiniz"
            autoComplete="email"
            className="ea-home-newsletter__input"
          />
          <button
            type="submit"
            className={cn(
              getButtonClassName({ variant: "primary", size: "md" }),
              "ea-home-newsletter__button",
            )}
          >
            Kaydol
          </button>
        </form>
      </Container>
    </section>
  );
}
