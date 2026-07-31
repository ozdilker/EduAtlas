import { ContentPageView, getButtonClassName, OwnerOnboardingPage } from "@eduatlas/ui";
import { redirect } from "next/navigation";
import { logoutAction } from "@/server/auth/auth-actions";
import { requireOwnerSession } from "@/server/auth/current-session";
import { resolveAuthenticatedOwnerInstitutionId } from "@/server/auth/owner-binding";
import { getOwnerPortalSnapshot } from "@/server/owner/get-owner-portal";

export const dynamic = "force-dynamic";

type OwnerOnboardingRouteProps = {
  searchParams: Promise<{ reason?: string | string[] }>;
};

/**
 * Institution owner onboarding — guides claimed owners to lead readiness.
 * Unbound authenticated users see a pending-binding state (no auto-bind).
 */
export default async function OwnerOnboardingRoutePage({
  searchParams,
}: OwnerOnboardingRouteProps) {
  const session = await requireOwnerSession();
  const institutionId = await resolveAuthenticatedOwnerInstitutionId(session.user.uid);
  const params = await searchParams;
  const reason = Array.isArray(params.reason) ? params.reason[0] : params.reason;

  if (!institutionId || reason === "missing_institution") {
    const isMissing = reason === "missing_institution" && Boolean(institutionId);
    return (
      <ContentPageView
        title={isMissing ? "Kurum kaydı bulunamadı" : "Kurum bağlantısı bekleniyor"}
        description={
          isMissing
            ? "Hesabınıza bağlı kurum kimliği katalogda yok. Bağlantıyı güncelleyin veya yeni sahiplenme başlatın."
            : "Hesabınız doğrulandı. Kurum sahipliği onaylandıktan sonra panel açılacak. Otomatik bağlama yoktur."
        }
        breadcrumbs={[
          { id: "home", label: "Ana sayfa", href: "/" },
          { id: "onboarding", label: "Kurum bağlantısı" },
        ]}
        nextSteps={[
          { id: "claim", label: "Kurum sahiplen", href: "/register" },
          { id: "home", label: "Ana sayfa", href: "/" },
        ]}
      >
        <p className="ea-content-page__note" role="status">
          {isMissing
            ? `Bağlı kurum kimliği (${institutionId}) yayında veya katalogda bulunamadı. Admin inceleme sonrası bağlama gerekebilir.`
            : reason === "unbound"
              ? "Onaylı bir kurum bağlantınız henüz yok. Review kuyruğundaki claim onayından sonra erişim açılır."
              : "Kurum paneline erişmek için onaylı sahiplik gerekir."}
        </p>
        <p className="ea-content-page__note">
          Oturum: {session.user.email}
          {session.user.emailVerified ? " (doğrulanmış)" : " (e-posta doğrulaması gerekli)"}
        </p>
        <form action={logoutAction}>
          <button
            type="submit"
            className={getButtonClassName({ variant: "secondary", size: "md" })}
          >
            Çıkış yap
          </button>
        </form>
      </ContentPageView>
    );
  }

  if (reason === "unbound") {
    redirect("/owner");
  }

  const snapshot = await getOwnerPortalSnapshot({ institutionId });
  if (!snapshot) {
    redirect("/owner/onboarding?reason=missing_institution");
  }

  const { data } = snapshot;

  return (
    <OwnerOnboardingPage
      institutionName={data.institutionName}
      institutionLogoUrl={data.institutionLogoUrl}
      publicProfileHref={data.publicProfileHref}
      profileCompleteness={data.profileCompleteness}
      recommendations={data.recommendations}
    />
  );
}
