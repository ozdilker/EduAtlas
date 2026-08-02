import { AdminReviewPage } from "@eduatlas/ui";
import type { Metadata } from "next";
import {
  getAdminReviewQueueView,
  type ReviewSearchParams,
} from "@/server/admin/get-admin-review-queue";
import { reviewInstitutionAction } from "@/server/admin/review-institution-action";
import {
  rematchGoogleBusinessAction,
  syncGoogleBusinessAction,
} from "@/server/admin/google-business-actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "İnceleme kuyruğu | EduAtlas Admin",
  robots: { index: false, follow: false },
};

type AdminReviewRouteProps = {
  searchParams: Promise<ReviewSearchParams>;
};

/**
 * Institution Review Queue — human review before publication.
 * Repository-backed; UI never touches Firestore.
 */
export default async function AdminReviewRoute({ searchParams }: AdminReviewRouteProps) {
  const params = await searchParams;
  const data = await getAdminReviewQueueView(params);
  return (
    <AdminReviewPage
      data={data}
      reviewAction={reviewInstitutionAction}
      syncGoogleAction={syncGoogleBusinessAction}
      rematchGoogleAction={rematchGoogleBusinessAction}
    />
  );
}
