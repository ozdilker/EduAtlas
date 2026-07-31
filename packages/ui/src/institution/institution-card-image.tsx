import Image from "next/image";
import { cn } from "../lib/cn";

export type InstitutionCardImageProps = {
  src?: string;
  alt?: string;
  className?: string;
};

/**
 * Institution card media thumb — visual only (navigation via title/CTA).
 */
export function InstitutionCardImage({ src, alt = "", className }: InstitutionCardImageProps) {
  return (
    <div className={cn("ea-institution-card__media", className)}>
      {src ? (
        <Image
          className="ea-institution-card__img"
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          loading="lazy"
        />
      ) : (
        <div
          className="ea-institution-card__img ea-institution-card__img--placeholder"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
