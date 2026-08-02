/**
 * EduAtlas Mail Design System (EMDS) theme tokens.
 * Components must reference these — no magic values in markup.
 */
export const mailTheme = Object.freeze({
  color: Object.freeze({
    brandRed: "#e62846",
    brandNavy: "#0f172a",
    white: "#ffffff",
    lightGray: "#f2f2f0",
    borderGray: "#e8e8e4",
    accentBlue: "#2563eb",
    successBg: "#ecfdf5",
    successText: "#059669",
    warningBg: "#fffbeb",
    warningText: "#d97706",
    infoBg: "#eff6ff",
    infoText: "#2563eb",
    text: "#334155",
    textMuted: "#64748b",
    textInverse: "#ffffff",
  }),
  space: Object.freeze({
    4: 4,
    8: 8,
    12: 12,
    16: 16,
    24: 24,
    28: 28,
    32: 32,
  }),
  radius: Object.freeze({
    sm: 6,
    md: 8,
    lg: 12,
  }),
  shadow: Object.freeze({
    card: "0 1px 3px rgba(15, 23, 42, 0.08)",
  }),
  font: Object.freeze({
    family: "Arial, Helvetica, sans-serif",
    size: Object.freeze({
      sm: 12,
      md: 14,
      lg: 16,
      xl: 22,
    }),
  }),
  layout: Object.freeze({
    maxWidthPx: 600,
  }),
  cta: Object.freeze({
    minHeightPx: 44,
  }),
});

export type MailTheme = typeof mailTheme;
