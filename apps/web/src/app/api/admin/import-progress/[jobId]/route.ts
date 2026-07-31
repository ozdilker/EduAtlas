import { readImportProgress } from "@/server/admin/import-progress-store";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ jobId: string }>;
};

/**
 * Polls Excel import progress for the admin loading bar.
 */
export async function GET(_request: Request, context: RouteContext) {
  const { jobId } = await context.params;
  const progress = await readImportProgress(jobId);

  if (!progress) {
    return NextResponse.json({ found: false }, { status: 404 });
  }

  return NextResponse.json({ found: true, progress });
}
