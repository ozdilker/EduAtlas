/**
 * EduAtlas Mail Design System (EMDS) theme tokens.
 * Aligned with Growth Center “Kurum Profili” HTML template.
 * Components must reference these — no magic values in markup.
 */
export const mailTheme = Object.freeze({
  color: Object.freeze({
    brandRed: "#d1272c",
    brandTeal: "#0d8a8e",
    brandNavy: "#111111",
    white: "#ffffff",
    lightGray: "#eef1f4",
    borderGray: "#eef1f4",
    borderSoft: "#e7ebee",
    accentBlue: "#2563eb",
    successBg: "#ecfdf5",
    successText: "#059669",
    warningBg: "#fffbeb",
    warningText: "#d97706",
    infoBg: "#eaf6f6",
    infoText: "#0d8a8e",
    text: "#111111",
    textBody: "#5c6b78",
    textMuted: "#7a8794",
    textFaint: "#8592a0",
    textLegal: "#9aa5b0",
    textInverse: "#ffffff",
    heroMuted: "#e3f4f4",
    stepsBg: "#eaf6f6",
    footerBg: "#f5f7f8",
    footerText: "#37454f",
  }),
  space: Object.freeze({
    4: 4,
    8: 8,
    12: 12,
    14: 14,
    16: 16,
    20: 20,
    24: 24,
    28: 28,
    32: 32,
    34: 34,
    40: 40,
    44: 44,
  }),
  radius: Object.freeze({
    sm: 2,
    md: 6,
    lg: 8,
    xl: 10,
  }),
  shadow: Object.freeze({
    card: "0 1px 3px rgba(15, 23, 42, 0.08)",
  }),
  font: Object.freeze({
    family: "Arial, Helvetica, sans-serif",
    display: "Georgia, 'Times New Roman', serif",
    size: Object.freeze({
      xs: 11,
      sm: 12,
      md: 14,
      lg: 15,
      xl: 20,
      hero: 30,
      h2: 21,
    }),
  }),
  layout: Object.freeze({
    maxWidthPx: 600,
    contentPadX: 40,
  }),
  cta: Object.freeze({
    minHeightPx: 44,
  }),
});

export type MailTheme = typeof mailTheme;
