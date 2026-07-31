"use client";

import { cn } from "../lib/cn";

export type EduAtlasLogoVariant = "full" | "mark" | "mono" | "small" | "app" | "stacked";

export type EduAtlasLogoProps = {
  variant?: EduAtlasLogoVariant;
  className?: string;
  title?: string;
  showTagline?: boolean;
};

/** Public brand mark — served from apps/web/public/brand/logo.png */
export const EDUATLAS_LOGO_SRC = "/brand/logo.png";

/**
 * Official EduAtlas logo — pin + book mark with wordmark.
 */
export function EduAtlasLogo({
  variant = "full",
  className,
  title = "EduAtlas",
  showTagline = false,
}: EduAtlasLogoProps) {
  const markOnly =
    variant === "mark" || variant === "mono" || variant === "small" || variant === "app";
  const stacked = variant === "stacked";
  const mono = variant === "mono";
  const sizeClass =
    variant === "app"
      ? "ea-logo--app"
      : variant === "small"
        ? "ea-logo--small"
        : variant === "mark" || variant === "mono"
          ? "ea-logo--mark"
          : variant === "stacked"
            ? "ea-logo--stacked"
            : "ea-logo--full";

  return (
    <span
      className={cn(
        "ea-logo",
        sizeClass,
        mono && "ea-logo--mono",
        stacked && "ea-logo--column",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={cn("ea-logo__mark", mono && "ea-logo__mark--mono")}
        src={EDUATLAS_LOGO_SRC}
        alt={markOnly ? title : ""}
        width={682}
        height={1024}
        decoding="async"
      />

      {!markOnly ? (
        <span className="ea-logo__text">
          <span className="ea-logo__wordmark">
            <span className="ea-logo__edu">Edu</span>
            <span className="ea-logo__atlas">Atlas</span>
          </span>
          {showTagline || stacked ? (
            <span className="ea-logo__tagline">Türkiye’nin Eğitim Atlası.</span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
