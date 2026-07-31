export const fontFamilies = {
  sans: '"Plus Jakarta Sans", "Segoe UI", sans-serif',
  display: '"Plus Jakarta Sans", "Segoe UI", sans-serif',
} as const;

export const typography = {
  display: {
    fontSize: "2.5rem",
    lineHeight: "1.15",
    fontWeight: 700,
  },
  h1: {
    fontSize: "2rem",
    lineHeight: "1.2",
    fontWeight: 700,
  },
  h2: {
    fontSize: "1.5rem",
    lineHeight: "1.25",
    fontWeight: 650,
  },
  h3: {
    fontSize: "1.25rem",
    lineHeight: "1.3",
    fontWeight: 650,
  },
  body: {
    fontSize: "1rem",
    lineHeight: "1.55",
    fontWeight: 400,
  },
  bodyEmphasis: {
    fontSize: "1rem",
    lineHeight: "1.55",
    fontWeight: 600,
  },
  small: {
    fontSize: "0.875rem",
    lineHeight: "1.45",
    fontWeight: 400,
  },
  caption: {
    fontSize: "0.8125rem",
    lineHeight: "1.4",
    fontWeight: 500,
  },
} as const;

export type TypographyToken = keyof typeof typography;
