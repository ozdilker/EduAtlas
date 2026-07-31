import { resolveClaimInviteToken } from "@eduatlas/application";
import { institutionIdAsString } from "@eduatlas/domain";
import { Container, InstitutionClaimCTA } from "@eduatlas/ui";
import { getInstitutionRepository } from "@/server/institutions/repository";
import { getClaimInviteTokenRepository } from "@/server/claims/claim-invite-token-repository";
import { submitClaimInviteAction } from "@/server/claims/submit-claim-invite-action";

export const dynamic = "force-dynamic";

type ClaimPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function ClaimPage({ searchParams }: ClaimPageProps) {
  const params = await searchParams;
  const rawToken = firstParam(params.token).trim();

  const [institutionRepository, claimInviteTokenRepository] = await Promise.all([
    getInstitutionRepository(),
    getClaimInviteTokenRepository(),
  ]);

  const resolved = await resolveClaimInviteToken(rawToken, {
    institutionRepository,
    claimInviteTokenRepository,
  });

  return (
    <Container size="md" className="py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Kurumunu sahiplen</h1>

      {!resolved.ok ? (
        <p className="mt-4 text-sm text-neutral-700">
          {resolved.reason === "missing"
            ? "Geçerli bir davet bağlantısı gerekli."
            : resolved.reason === "expired"
              ? "Bu davet bağlantısının süresi dolmuş."
              : resolved.reason === "used"
                ? "Bu davet bağlantısı daha önce kullanılmış."
                : "Davet bağlantısı geçersiz veya kurum bulunamadı."}
        </p>
      ) : (
        <div className="mt-6">
          <InstitutionClaimCTA
            institutionName={resolved.institution.name}
            institutionId={institutionIdAsString(resolved.institution.id)}
            claimInviteTokenId={resolved.tokenId}
            action={submitClaimInviteAction}
            variant="panel"
          />
        </div>
      )}
    </Container>
  );
}
