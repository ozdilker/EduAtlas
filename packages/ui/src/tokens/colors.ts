export const colors = {
  primary: {
    50: "#E6F5F5",
    100: "#C5E8E8",
    600: "#0F6B6B",
    700: "#0B5353",
  },
  secondary: {
    50: "#E8EEF5",
    600: "#1F4B7A",
  },
  neutral: {
    0: "#FFFFFF",
    25: "#F7F8FA",
    50: "#F0F2F5",
    100: "#E2E6EB",
    300: "#B0B8C2",
    500: "#6B7280",
    700: "#374151",
    900: "#111827",
  },
  success: {
    50: "#E8F7EF",
    600: "#1B7A4E",
  },
  warning: {
    50: "#FFF6E5",
    600: "#B86E00",
  },
  error: {
    50: "#FDECEC",
    600: "#C43131",
  },
  info: {
    50: "#E8EEF5",
    600: "#1F4B7A",
  },
} as const;

export const semanticColors = {
  background: colors.neutral[25],
  surface: colors.neutral[0],
  border: colors.neutral[100],
  textPrimary: colors.neutral[700],
  textMuted: colors.neutral[500],
  textInk: colors.neutral[900],
  textInverse: colors.neutral[0],
  focusRing: colors.primary[600],
  link: colors.primary[700],
} as const;

export type ColorScale = typeof colors;
