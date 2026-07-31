"use client";

import { useEffect } from "react";
import { restoreOwnerPortalScroll } from "./owner-portal-scroll";

export type OwnerPortalScrollRestoreProps = {
  /** When false, keep the stored value for a subsequent restore (e.g. drawer still open). */
  clear?: boolean;
};

/**
 * Restores owner portal scroll after lead drawer navigation.
 */
export function OwnerPortalScrollRestore({ clear = true }: OwnerPortalScrollRestoreProps) {
  useEffect(() => {
    restoreOwnerPortalScroll({ clear });
  }, [clear]);

  return null;
}
