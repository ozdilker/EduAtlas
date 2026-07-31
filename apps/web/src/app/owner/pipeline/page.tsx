import { redirect } from "next/navigation";

/**
 * Legacy Talep Hattı route — merged into Talepler workspace (Pipeline tab).
 */
export default function OwnerPipelinePage() {
  redirect("/owner/leads?view=pipeline");
}
