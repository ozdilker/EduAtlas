"use client";

import { GrowthCenterPage } from "./growth-center/growth-center-page";
import type { AdminOutreachPageProps } from "./admin-outreach-page-types";

/**
 * Growth Center entry (route `/admin/outreach`).
 */
export function AdminOutreachPage(props: AdminOutreachPageProps) {
  return <GrowthCenterPage {...props} />;
}
