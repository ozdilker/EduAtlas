"use client";

import { ThemeProvider } from "@eduatlas/ui";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  return <ThemeProvider density="comfortable">{children}</ThemeProvider>;
}
