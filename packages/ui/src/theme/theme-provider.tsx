"use client";

import { createContext, type ReactNode, useContext, useEffect, useMemo } from "react";

export type ThemeMode = "light";
export type ThemeDensity = "comfortable" | "compact";

export type ThemeContextValue = {
  theme: ThemeMode;
  density: ThemeDensity;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  density: "comfortable",
});

export type ThemeProviderProps = {
  children: ReactNode;
  theme?: ThemeMode;
  density?: ThemeDensity;
};

/**
 * Applies design-system theme attributes and exposes theme context.
 * Dark mode is intentionally out of scope (future).
 */
export function ThemeProvider({
  children,
  theme = "light",
  density = "comfortable",
}: ThemeProviderProps) {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.density = density;
  }, [theme, density]);

  const value = useMemo(
    () => ({
      theme,
      density,
    }),
    [theme, density],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
