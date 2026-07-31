import { AdminImportPage } from "@eduatlas/ui";
import type { Metadata } from "next";
import { importInstitutionsAction } from "@/server/admin/import-institutions-action";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export const metadata: Metadata = {
  title: "Kurum içe aktarma | EduAtlas Admin",
  robots: { index: false, follow: false },
};

/**
 * Institution Import Workflow — CSV/XLSX → preview → validate → import.
 * Persistence goes through InstitutionRepository via a server action.
 */
export default function AdminImportRoute() {
  return <AdminImportPage action={importInstitutionsAction} />;
}
