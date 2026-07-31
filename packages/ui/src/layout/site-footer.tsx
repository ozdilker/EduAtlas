import { EduAtlasLogo } from "../brand/eduatlas-logo";
import { Container } from "../components/container";
import { cn } from "../lib/cn";
import { getFooterSections, getSocialPlaceholders, isNavItemActive } from "./navigation";

export type SiteFooterProps = {
  appName?: string;
  currentPath?: string;
  className?: string;
};

/**
 * Public site footer — explore, cities, categories, company, legal.
 */
export function SiteFooter({ appName = "EduAtlas", currentPath, className }: SiteFooterProps) {
  const sections = getFooterSections();
  const socialLinks = getSocialPlaceholders();
  const year = new Date().getFullYear();

  return (
    <footer className={cn("ea-footer", className)}>
      <Container size="xl" className="ea-footer__inner">
        <div className="ea-footer__brand">
          <a href="/" className="ea-footer__brand-link" aria-label={`${appName} ana sayfa`}>
            <EduAtlasLogo variant="full" title={appName} />
          </a>
          <p className="ea-footer__brand-tagline">
            Türkiye’nin eğitim atlası — ailelere güvenli karar, kurumlara daha iyi erişim.
          </p>
          <div className="ea-footer__brand-actions">
            <a href="/search">Arama</a>
            <a href="/register">Kurumunu Sahiplen</a>
          </div>
        </div>

        <div className="ea-footer__sections">
          {sections.map((section) => (
            <section
              key={section.id}
              className="ea-footer__section"
              aria-labelledby={`footer-${section.id}`}
            >
              <h2 id={`footer-${section.id}`} className="ea-footer__heading">
                {section.title}
              </h2>
              <ul className="ea-footer__list">
                {section.links.map((link) => {
                  const current = isNavItemActive(link.href, currentPath);

                  return (
                    <li key={link.id}>
                      <a href={link.href} aria-current={current ? "page" : undefined}>
                        {link.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          <section className="ea-footer__section" aria-labelledby="footer-social">
            <h2 id="footer-social" className="ea-footer__heading">
              Sosyal
            </h2>
            <ul className="ea-footer__list">
              {socialLinks.map((link) => (
                <li key={link.id}>
                  <span className="ea-footer__social-placeholder">{link.label}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </Container>

      <Container size="xl" className="ea-footer__legal-bar">
        <p className="ea-footer__copyright">
          © {year} {appName}. Tüm hakları saklıdır.
        </p>
      </Container>
    </footer>
  );
}
