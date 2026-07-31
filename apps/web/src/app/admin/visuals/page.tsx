import { AdminVisualsPage } from "@eduatlas/ui";
import type { Metadata } from "next";
import {
  getAdminVisualsPageData,
  updateAdminHomepageVisualAction,
} from "@/server/admin/homepage-visuals-action";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Site görselleri | EduAtlas Admin",
  robots: { index: false, follow: false },
};

/**
 * Admin homepage visuals — hero + popular city card images.
 */
export default async function AdminVisualsRoute() {
  const data = await getAdminVisualsPageData();
  return <AdminVisualsPage data={data} uploadAction={updateAdminHomepageVisualAction} />;
}
