import { cn } from "../lib/cn";

export type BrandIllustrationVariant = "hero" | "compact" | "empty";

export type BrandIllustrationProps = {
  variant?: BrandIllustrationVariant;
  className?: string;
};

/**
 * Abstract education-atlas illustration — modern, minimal, Turkish warmth.
 * Decorative only; inspired by concept art direction (not pixel copies).
 */
export function BrandIllustration({ variant = "hero", className }: BrandIllustrationProps) {
  return (
    <div
      className={cn("ea-brand-illustration", `ea-brand-illustration--${variant}`, className)}
      aria-hidden="true"
    >
      <svg
        className="ea-brand-illustration__svg"
        viewBox="0 0 400 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="presentation"
      >
        <defs>
          <linearGradient id="ea-illus-hill-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c5e8e8" />
            <stop offset="100%" stopColor="#e6f5f5" />
          </linearGradient>
          <linearGradient id="ea-illus-hill-mid" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0f6b6b" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#9b1e2e" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id="ea-illus-book" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0f6b6b" />
            <stop offset="100%" stopColor="#0b5353" />
          </linearGradient>
          <linearGradient id="ea-illus-growth" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#9b1e2e" />
            <stop offset="100%" stopColor="#0f6b6b" />
          </linearGradient>
        </defs>

        {/* Landscape — Anatolian hills abstraction */}
        <path
          d="M0 248 C80 210 140 230 200 218 C260 206 320 228 400 210 L400 320 L0 320 Z"
          fill="url(#ea-illus-hill-back)"
        />
        <path
          d="M0 268 C100 242 170 258 240 248 C300 240 350 252 400 238 L400 320 L0 320 Z"
          fill="url(#ea-illus-hill-mid)"
        />

        {/* Atlas pin — orientation */}
        <circle cx="292" cy="92" r="28" fill="#fbeaec" stroke="#9b1e2e" strokeWidth="2" />
        <circle cx="292" cy="92" r="8" fill="#9b1e2e" />
        <path d="M292 100 L292 132" stroke="#9b1e2e" strokeWidth="2.5" strokeLinecap="round" />

        {/* Open book — education */}
        <path d="M108 168 L168 148 L168 228 L108 248 Z" fill="url(#ea-illus-book)" opacity="0.92" />
        <path d="M168 148 L228 168 L228 248 L168 228 Z" fill="#0f6b6b" opacity="0.75" />
        <path d="M168 148 L168 228" stroke="#fdfcf9" strokeWidth="2" opacity="0.7" />
        <path
          d="M122 188 H154 M122 204 H150 M182 188 H214 M182 204 H210"
          stroke="#fdfcf9"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.55"
        />

        {/* Growth path */}
        <path
          d="M56 252 C96 220 132 206 168 188 C204 170 236 148 268 118"
          stroke="url(#ea-illus-growth)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="6 8"
          opacity="0.65"
        />

        {/* Family nodes — human, abstract */}
        <circle cx="88" cy="118" r="16" fill="#fbeaec" stroke="#9b1e2e" strokeWidth="2" />
        <circle cx="128" cy="104" r="12" fill="#e6f5f5" stroke="#0f6b6b" strokeWidth="2" />
        <circle cx="156" cy="126" r="10" fill="#e6f5f5" stroke="#0f6b6b" strokeWidth="2" />
        <path
          d="M88 134 C104 148 120 152 156 136"
          stroke="#0f6b6b"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />

        {/* Campus block — trust / institution */}
        <rect
          x="248"
          y="168"
          width="72"
          height="52"
          rx="8"
          fill="#fdfcf9"
          stroke="#e6e2db"
          strokeWidth="2"
        />
        <rect x="262" y="182" width="14" height="14" rx="2" fill="#c5e8e8" />
        <rect x="282" y="182" width="14" height="14" rx="2" fill="#c5e8e8" />
        <rect x="302" y="182" width="14" height="14" rx="2" fill="#c5e8e8" />
        <rect x="262" y="202" width="54" height="6" rx="2" fill="#f4d0d6" />
      </svg>
    </div>
  );
}
