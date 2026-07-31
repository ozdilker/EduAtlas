export const shadows = {
  none: "none",
  sm: "0 1px 2px rgba(17, 24, 39, 0.06), 0 1px 3px rgba(17, 24, 39, 0.08)",
} as const;

export type ShadowToken = keyof typeof shadows;
