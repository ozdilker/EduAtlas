"use client";

import { ThemeProvider } from "@eduatlas/ui";
import type { ReactNode } from "react";
import { Ga4Scripts } from "@/lib/analytics/ga4";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider density="comfortable">
      <Ga4Scripts />
      {children}
    </ThemeProvider>
  );
}
