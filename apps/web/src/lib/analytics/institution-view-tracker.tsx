"use client";

import { useEffect, useRef } from "react";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics/track-event";

export type InstitutionViewTrackerProps = {
  institutionId: string;
  cityId?: string;
  districtId?: string;
  institutionType?: string;
};

/**
 * Fires institution_view once per mounted profile (Strict Mode safe).
 */
export function InstitutionViewTracker({
  institutionId,
  cityId,
  districtId,
  institutionType,
}: InstitutionViewTrackerProps) {
  const sentFor = useRef<string | null>(null);

  useEffect(() => {
    const id = institutionId.trim();
    if (!id || sentFor.current === id) return;
    sentFor.current = id;
    trackEvent(ANALYTICS_EVENTS.InstitutionView, {
      institution_id: id,
      ...(cityId ? { city_id: cityId } : {}),
      ...(districtId ? { district_id: districtId } : {}),
      ...(institutionType ? { institution_type: institutionType } : {}),
    });
  }, [institutionId, cityId, districtId, institutionType]);

  return null;
}
